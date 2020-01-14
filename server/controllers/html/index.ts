import { IUserNames } from '../../interfaces/IUserDocument';

let worked: string[] = [];
let lunched: string[] = [];
let clearTime: string[] = [];

export default (out: IUserNames): string => {
  worked = [];
  lunched = [];
  clearTime = [];

  const html: string = `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0" >
    <meta http-equiv="content-type" content="text/html" charset="ISO-8859-1">
    <title>Document</title>
    <style>table{table-layout:fixed;border-collapse:collapse}table:first-child{margin-bottom:5px}.td-head{padding:8px 10px 25px 10px}td,th{border:1px solid #000;padding:5px 8px;width:5%}</style>
  </head>
  <body>
    <table>
      <thead>
        <tr>
          <td colspan="3" class="td-head"><b>Дата</b><br><span>${out.date}</span></td>
          <td colspan="3" class="td-head"><b>Кран</b><br><span>${out.cranes}</span></td>
          <td colspan="3" class="td-head"><b>Номер крановщика</b><br><span>${out.phones}</span></td>
        </tr>
        <tr>
          <td colspan="3" class="td-head"><b>Адрес стройки</b><br><span>${out._id.address}</span></td>
          <td colspan="3" class="td-head"><b>Работник</b><br><span>${out.username}</span></td>
          <td colspan="3" class="td-head"><b>Логин</b><br><span>${out._id.login}</span></td>
        </tr>
      </thead>
    </table>
    <table>
      <tbody>
        <tr>
          <th>Число</th>
          <th>Пришёл</th>
          <th>Ушёл</th>
          <th>Проработал</th>
          <th>Обед</th>
          <th>Чистое время</th>
          <th>Крановщик</th>
        </tr>
        ${out.tables.map((table, i) => `<tr>
          <td>${table.day < 10 ? '0' + table.day : table.day}</td>
          <td>${table.coming}</td>
          <td>${table.leaving}</td>
          <td>${getFullTime(table.coming, table.leaving)}</td>
          <td>${addTimeToLunchArray(table.lunch)}</td>
          <td>${getFullTimeWithoutLunch(table.coming, table.leaving, table.lunch)}</td>
          <td>${out.username}</td>
        </tr>`).join('')}
        <tr>
          <td colspan="3">Общее время</td>
          <td>${sumOfTimes(worked)}</td>
          <td>${sumOfTimes(lunched)}</td>
          <td>${sumOfTimes(clearTime)}</td>
        </tr>
      </tbody>
    </table>
  </body>
  </html>`;

  return html;
}

function getFullTime(firstDate: string, secondDate: string, flag?: boolean): string {
  let getDate = (string: string): any => new Date(0, 0, 0, +string.split(':')[0], +string.split(':')[1]);
  let different = (getDate(secondDate) - getDate(firstDate));
  let differentRes: number, hours: number, minuts: number;
  
  if (different > 0) {
    differentRes = different;
    hours = Math.floor((differentRes % 86400000) / 3600000);
    minuts = Math.round(((differentRes % 86400000) % 3600000) / 60000);
  } else {
    differentRes = Math.abs((getDate(firstDate) - getDate(secondDate)));
    hours = Math.floor(24 - (differentRes % 86400000) / 3600000);
    minuts = Math.round(60 - ((differentRes % 86400000) % 3600000) / 60000);
  }

  let result: string = (hours < 10 ? '0' + hours : hours) + ':' + (minuts < 10 ? '0' + minuts : minuts);

  if (!flag)
    worked.push(result);
  
  return result;
}

function addTimeToLunchArray(lunchTime: string): string {
  lunched.push(lunchTime);
  return lunchTime;
}

function getFullTimeWithoutLunch(firstDate: string, secondDate: string, lunchDate: string): string {
  let newSecondTime = getFullTime(lunchDate, secondDate, true);
  let result = getFullTime(firstDate, newSecondTime, true);

  clearTime.push(result);

  return result;
}

function sumOfTimes(arrayOfTimes: string[]): string { 
  let result = arrayOfTimes.reduce((time1, time2) => {
    let hour = 0;
    let minute = 0;

    let splitTime1 = time1.split(':');
    let splitTime2 = time2.split(':');

    hour = parseInt(splitTime1[0]) + parseInt(splitTime2[0]);
    minute = parseInt(splitTime1[1]) + parseInt(splitTime2[1]);
    hour = minute >= 60 ? hour + 1 : hour;
    minute = minute > 60 ? minute - 60 : hour == 60 ? 0 : minute;
    
    let response = (hour < 10 ? '0' + hour : hour) + ':' + (minute < 10 ? '0' + minute : minute);

    return response;
  });
  
  return result;
}