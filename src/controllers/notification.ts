import * as express from 'express';
import notificationQuery from '../dao/notificationDAO'
import { route } from './user';
import { pagination,checkParameter } from '../lib/lib'
const router = express.Router();

const createNotification = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const splitedReferer = req.header('Referer').split('/');``
  const redirectTo = splitedReferer[splitedReferer.length-1];
  console.log(redirectTo)
  if (checkParameter([req.body.message])) {
    res.status(400).send(
      {
        'message': 'create notification'
      }
    )
  }
  let data: Array<any> =
  [
    1, // 공지
    req.body.message
  ];
  try {
    let result;
    if (req.body.receiver === 'all') {
      result = await notificationQuery.createNotificationToAll(data);
    } else if (req.body.receiver === 'mentor') {
      result = await notificationQuery.createNotificationToMentor(data);
    } else if (req.body.receiver === 'mentee') {
      result = await notificationQuery.createNotificationToMentee(data);
    } else {
      data.push(req.body.receiver_ID)
      console.log(data);
      result = await notificationQuery.createNotification(data);
    }

    res.status(200).redirect(`/${redirectTo}`);
  } catch (e) {
    res.status(500).send()
  }
}

const getNotifications = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (checkParameter([req.query.page, req.query.range])) {
    res.status(400).send(
      {
        'message': 'get notifications'
      }
    )
  }
  const page = parseInt(req.query.page.toString());
  const range = parseInt(req.query.range.toString());
  
  const query = req.query;
  let extraQuery = '';
  let urlPattern = '?';

  if (Object.keys(query).length !== 0) {
    extraQuery += ' WHERE un.id >= 0 ';
    
    if (query.searchType !== null && query.searchType !== undefined && query.searchType !== 'all') {
      extraQuery += `AND n.type = ${query.searchType} `;
      urlPattern += `&searchType=${query.searchType}`;
    }

    if (query.isChecked !== null && query.isChecked !== undefined && query.isChecked !== 'all') {
      extraQuery += `AND un.is_checked = ${query.isChecked} `;
      urlPattern += `&isChecked=${query.isChecked}`;
    }

    if (query.sender !== null && query.sender !== undefined && query.senderID !== null && query.senderID !== undefined) {
      const senderID = query.senderID.toString().trim();
      extraQuery += `AND sender.ID LIKE '%${senderID}%' `;
      urlPattern += `&sender=${query.sender}`;
    }

    if (query.receiver !== null && query.receiver !== undefined && query.receiverID !== null && query.receiverID !== undefined) {
      const receiverID = query.receiverID.toString().trim();
      extraQuery += `AND receiver.ID LIKE '%${receiverID}%' `;
      urlPattern += `&receiver=${query.state}`;
    }
  }

  try {
    let result = pagination(await notificationQuery.getNotifications(extraQuery, page),range, page);
    
    if(result === undefined) {
      result = new Array();
    }
    let url = new Array();
    
    for (let i = result[0][0]['startPage']; i <= result[0][0]['endPage']; ++i) {
      url.push(urlPattern + `&page=${i}&range=${range}`);
    }
    res.status(200).render('notification/notification', 
    {
      'page': result[0],
      "notifications" : result[1],
      'url': url
    });
  } catch (e) {
    res.status(500).send()
  }

}

const getNotification = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.log('controller: getNotification')
  if (checkParameter([req.query.page, req.query.range, req.body.type, req.body.receiver_ID, req.body.sender_ID])) {
    res.status(400).send(
      {
        'message': 'get notification'
      }
    )
  }
  const page = parseInt(req.query.page.toString());
  const range = parseInt(req.query.range.toString());
  
  const query = req.query;
  let extraQuery = '';
  let urlPattern = '?';
  try {
    let data;
    if (req.body.is_checked === 'all'){
      data = 
      [ req.body.type,
        0,
        1,
        req.body.receiver_ID,
        req.body.sender_ID,
        req.body.type,
        0,
        1,
        req.body.receiver_ID,
        req.body.sender_ID
      ]
      
    } else {
      data = 
      [
        req.body.type,
        req.body.is_checked,
        req.body.is_checked,
        req.body.receiver_ID,
        req.body.sender_ID,
        req.body.type,
        req.body.is_checked,
        req.body.is_checked,
        req.body.receiver_ID,
        req.body.sender_ID
      ]
    }

    const result = pagination(await notificationQuery.getUserNotification(data),range, page);
    
    let url = new Array();

    for (let i = result[0][0]['startPage']; i <= result[0][0]['endPage']; ++i) {
      url.push(urlPattern + `&page=${i}&range=${range}`);
    }

    res.status(200).render('notification/notification',
      {
        'message': 'get notifiation success',
        'page': result[0],
        'notifications': result[1],
        'url': url
      }
    )
  } catch (e) {
    res.status(500).send()
  }
}

const deleteUserNotification = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.log('controller: deleteUserNotification')
  if (checkParameter([req.params.id])) {
    res.status(400).send(
      {
        'message': 'delete user notification'
      }
    )
  }
  const data = 
  [
    req.params.id
  ]
  try {
    const result = await notificationQuery.deleteUserNotification(data);
    res.status(200).send(
      {
        'message': 'delete notification success'
      }
    )
  } catch {
    res.status(500).send()
  }
}

router.get('/', getNotifications);
router.post('/', createNotification);
router.post('/search', getNotification);
router.delete('/:id', deleteUserNotification);
export = router;