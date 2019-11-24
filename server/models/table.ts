import * as moment from 'moment-timezone';
import { Schema, Model, Types, model } from 'mongoose';
import { ITableDocument, INewTable, IAddTable, IUserTable, IUserNames, IGrouppedTable, ITablesPerMonth, IDate, IUserTableChange, ITableChange } from '../interfaces/ITableDocument';
import { User, AuthError } from './user';
import { NewsError } from './new';

export interface ITableModel extends Model<ITableDocument> {
  get(): INewTable[];
  fetch(): ITablesPerMonth;
  archive(date: string): IUserNames[];
  workers(date: string): { workers?: IUserNames[], date?: string };
  worker(date: string, login: string): IUserTableChange[];
  address(date: string, login: string, address: string): any;
  change(data: ITableChange): any;
  info(id: Schema.Types.ObjectId, date: { day: string, month: string }): IUserTable;
  add(data: IAddTable): void
}

const schema: Schema = new Schema({
  date: {
    type: Date,
    default: moment.tz(Date.now(), "Europe/Moscow")
  },
  saved: {
    type: Boolean,
    default: false
  },
  users: [{
    _id: {
      type: Schema.Types.ObjectId,
      unique: true,
      required: true
    },
    username: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    lunch: {
      type: String,
      default: "00:00:00"
    },
    coming: String,
    leaving: String,
    address: {
      type: String,
      required: true
    },
    crane: {
      type: String,
      required: true
    },
    login: String,
    day: Number
  }]
});

// Static
schema.static('get', async () => {
  try {
    const newDate: Date = new Date();
    const dates: IDate = {
      year: newDate.getFullYear(),
      month: newDate.getMonth(),
      currentDay: newDate.getDate()
    }
    
    let currentMonth: number = dates.currentDay >= 1 && dates.currentDay <= 6 ? dates.month : dates.month + 1
    let normalizeDate: Date = new Date(`${currentMonth}.01.${dates.year}`);
    
    const tables: ITableDocument[] = await Table.aggregate([
      { $match: { date: { $gte: normalizeDate } } },
      { $sort: { date: 1 } }
    ]).exec();

    let daysInMonth: number = getDaysInMonth(currentMonth, dates.year);

    let newTables: INewTable[] = [];
    let endF: boolean = false;
    let date: string;
    
    if (tables.length > 0) {
      if (tables.length < 7) {
        for (let increment: number = tables.length; increment <= daysInMonth; increment++) {
          date = new Date(Date.UTC(dates.year, currentMonth - 1, increment)).toISOString();
          newTables.push({ date: date });

          if (increment === daysInMonth && !endF) {
            endF = true;
            daysInMonth = 6;
            increment = 0;
  
            currentMonth++;
          }
        }

        Table.create(newTables);
        return [...newTables, tables];
      }  
      
      return tables;
    }

    for (let increment = 1; increment <= daysInMonth; increment++) {
      date = new Date(Date.UTC(dates.year, currentMonth - 1, increment)).toISOString();
      newTables.push({ date: date });

      if (increment === daysInMonth && !endF) {
        endF = true;
        increment = 0;
        daysInMonth = 6;

        currentMonth++;
      }
    }

    Table.create(newTables);
    return newTables;
  } catch (err) {
    throw err;
  }
});

schema.static('fetch', async () => {
  try {
    const newDate: Date = new Date();
    const dates: IDate = {
      year: newDate.getFullYear(),
      month: newDate.getMonth()
    };
    const tables: IGrouppedTable[] = await Table.aggregate([
      { $match: { date: { $ne: null } } },
      { $group: 
        { 
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date'}
          },
          doc: {$push: '$$ROOT'},
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.month': -1 } }
    ]).exec();

    let daysInMonth: number = getDaysInMonth(dates.month + 1, dates.year);

    let newTables: INewTable[] = [];
    let endF: boolean = false;
    let date: string;
    
    let response: ITablesPerMonth = {};
    
    if (tables.length > 0) {
      response.tables = tables;
      response.total_elements = true;

      return response;
    }

    for (let increment = 1; increment <= daysInMonth; increment++) {
      date = new Date(Date.UTC(dates.year, dates.month, increment)).toISOString();
      newTables.push({ date: date });

      if (increment === daysInMonth && !endF) {
        endF = true;
        increment = 0;
        daysInMonth = 6;

        dates.month++;
      }
    }

    Table.create(newTables);

    response.tables = [{_id: { year: dates.year, month: dates.month }, doc: [], count: newTables.length - 6}];
    response.total_elements = true; 

    return response;
  } catch (err) {
    throw err;
  }
});

schema.static('workers', async (date: string) => {
  const dateForSearch: Date = new Date(date);
  const daysInMonth: number = getDaysInMonth(+date.split('-')[1], +date.split('-')[0]);
  const tables: ITableDocument[] = await Table.aggregate([
    { $match: { date: { $gte: dateForSearch } } },
    { $limit: daysInMonth },
    { $unwind: "$users" },
    { $group: { _id: null, usrs: { $addToSet : "$users" } } },
    { $project: {_id: 0, users: "$usrs"} }
  ]).exec();
  const response: { workers?: IUserNames[], date?: string } = {};
  
  if (tables.length < 1) {
    response.workers = [];
    response.date = date;

    return response;
  }

  const uniqueWorkers: IUserNames[] = removeDuplicates(tables[0].users, 'login');
  const sortedWorkers: IUserNames[] = sortArray(uniqueWorkers);
  
  response.workers = sortedWorkers;
  response.date = date;

  return response;
});

schema.static('change', async (data: ITableChange) => {
  if (!data) throw new NewsError('Отсутствие данных для дальней обработки запроса.');
  if (!data.date || !data.address || !data.login || !data.staticData) throw new NewsError('Данные заполнены не полностью.');

  const { date, address, login, staticData } = data;
  const dateForSearch: Date = new Date(date);
  const daysInMonth: number = getDaysInMonth(+date.split('-')[1], +date.split('-')[0]);

  for (let i = 0; i < staticData.length; i++) {
    await Table.updateMany(
      { 
        date: { $gte: dateForSearch }, 
        'users.login': login, 
        'users.address': address, 
        'users.day': staticData[i].day
      }, 
      { 
        '$set': {
          'users.$.coming': staticData[i].coming,
          'users.$.leaving': staticData[i].leaving,
          'users.$.lunch': staticData[i].lunch
        }
      },
      {
        '$limit': daysInMonth
      }
    );
  }
});

schema.static('worker', async (date: string, login: string) => {
  const dateForSearch: Date = new Date(date);
  const daysInMonth: number = getDaysInMonth(+date.split('-')[1], +date.split('-')[0]);
  const worker = await Table.aggregate([
    { 
      $match: {
        date: { $gte: dateForSearch },
        users: { $elemMatch: { login: login } }
      }
    },
    { $limit: daysInMonth },
    { $unwind: "$users" },
    { $group: { _id: null, usrs: { $addToSet : "$users" } } },
    { $project: {_id: 0, users: "$usrs"} }
  ]).exec();

  const workers: IUserTable[] = worker[0].users;
  const workersFilter: IUserTable[] = await filterAndSortWorkers(workers, login);
  const addresses: string[] = await fetchAddressesOfArrayAndRemoveDublicates(workersFilter, 'address');
  const tablesForAddress: IUserTable[] = await filterDaysForFirstAddress(workersFilter, addresses[0]);
  const staticData: { username: string, login: string, phones: string[], cranes: string[] } = await fetchStaticData(tablesForAddress, workersFilter); 
  const response: IUserTableChange = {
    addresses: addresses,
    tablesForAddress: tablesForAddress,
    staticData: staticData,
    date
  };

  return response;
});

schema.static('address', async (date: string, login: string, address: string) => {
  const dateForSearch: Date = new Date(date);
  const daysInMonth: number = getDaysInMonth(+date.split('-')[1], +date.split('-')[0]);
  const worker = await Table.aggregate([
    { 
      $match: {
        date: { $gte: dateForSearch },
        users: { $elemMatch: { login: login } }
      }
    },
    { $limit: daysInMonth },
    { $unwind: "$users" },
    { $group: { _id: null, usrs: { $addToSet : "$users" } } },
    { $project: {_id: 0, users: "$usrs"} }
  ]).exec();

  const workers: IUserTable[] = worker[0].users;
  const workersFilter: IUserTable[] = await filterAndSortWorkers(workers, login);
  const addresses: string[] = await fetchAddressesOfArrayAndRemoveDublicates(workersFilter, 'address');
  const tablesForAddress: IUserTable[] = await filterDaysForFirstAddress(workersFilter, addresses[addresses.indexOf(address)]);
  const cranes: string[] = tablesForAddress.map(obj => obj.crane).filter((elem, pos, arr) => arr.indexOf(elem) == pos);
  const response: { tablesForAddress: IUserTable[], cranes: string[] } = {
    tablesForAddress,
    cranes
  };

  return response;
});

schema.static('info', async (id: Schema.Types.ObjectId, date: { day: string, month: string }) => {
  if (!id || !date) throw new TableError("Отсутствие данных для дальнейшей обработки запроса.");
  if (!date.day || !date.month) throw new TableError("Данные заполнены не полностью.");

  const { day, month } = date;
  const year: number = new Date().getFullYear();
  const dateForSearch: Date = new Date(Date.UTC(year, getMonthIndex(month), +day));
  const info = await Table.findOne({ date: dateForSearch }).exec();

  if (!info)
    return null;

  const user = info.users.find(user => user._id == id);
  return user;
});

schema.static('add', async (data: IAddTable) => {
  if (!data || !data.table_d) throw new TableError('Данные заполнены неполностью.');
  if (!data.table_d._id) throw new TableError('Неверный индентификатор.');

  const { date, table_d } = data;
  const { login } = await User.findById(table_d._id).exec();
  const table = await Table.findOne({ date }).exec();
  const day = new Date(date).getDate();

  if (!table) return;

  let userIndex = table.users.findIndex(usr => usr._id == table_d._id);

  if (!table_d.lunch || typeof table_d.lunch !== 'string')
    table_d.lunch = '00:00:00';

  table_d.login = login;
  table_d.day = day;
  
  if (userIndex === -1) {
    table.users.push(table_d);
  } else {
    table.users[userIndex] = table_d;
  }

  table.save();
});

schema.static('archive', async (date: string) => {
  if (!date) throw new AuthError('Отсутствие данных для дальнейшей обработки запроса.');

  const dateForSearch: Date = new Date(date);
  const daysInMonth: number = getDaysInMonth(+date.split('-')[1], +date.split('-')[0]);
  const worker = await Table.aggregate([
    { $match: { date: { $gte: dateForSearch } } },
    { $limit: daysInMonth },
    { $unwind: "$users" },
    { $group: { _id: null, usrs: { $addToSet : "$users" } } },
    { $project: {_id: 0, users: "$usrs"} }
  ]).exec();

  if (!worker[0]) return null;

  const workers: IUserTable[] = worker[0].users;
  const staticData: IUserNames[] = await removeDuplicatesByAddresses(workers);

  const response: IUserNames[] = await Promise.all(staticData.map(async (obj: IUserNames) => {
    const { tablesForAddress } = await Table.address(date, obj.login, obj.address);
    const cranes: string[] = tablesForAddress.map(obj => obj.crane).filter((elem, pos, arr) => arr.indexOf(elem) == pos);
    const phones: string[] = tablesForAddress.map(obj => obj.phone).filter((obj, pos, arr) => arr.indexOf(obj) == pos);

    obj.otherData = tablesForAddress;
    obj.date = date;
    obj.phones = phones;
    obj.cranes = cranes;

    return obj;
  }));

  return response;
});

export const Table: ITableModel = model<ITableDocument, ITableModel>("Table", schema);

// Methods
function removeDuplicatesByAddresses(array: IUserTable[]): IUserNames[] {
  const filterArrayOfWorkers: any = [];
  const arrayOfWorkers = array.reduce((r, a) => {
    r[a.username] = r[a.username] || [];
    r[a.username].push(a);
    return r;
  }, Object.create(null));

  for (let worker in arrayOfWorkers) {
    const props: string[] = arrayOfWorkers[worker].map(property => property.address);
    const uniqueArr: IUserTable[] = arrayOfWorkers[worker].filter((obj, pos) => props.indexOf(obj.address) == pos);

    filterArrayOfWorkers.push(uniqueArr);
  }

  const merged: IUserTable[] = [].concat.apply([], filterArrayOfWorkers);
  const response: IUserNames[] = merged.map(obj => {
    const username: IUserNames = {
      _id: obj._id,
      username: obj.username,
      login: obj.login,
      address: obj.address
    };

    return username;
  });

  return response;
}

function getMonthIndex(month: string): number {
  const monthNames: string[] = [
    "Январь", "Февраль", "Март",
    "Апрель", "Май", "Июнь", "Июль",
    "Август", "Сентябрь", "Октябрь",
    "Ноябрь", "Декабрь"
  ];
  const index: number = monthNames.indexOf(month); 

  return index;
}

function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

function sortArray(array: IUserNames[]): IUserNames[] {
  const sortArr: IUserNames[] = array.sort((a, b) => {
    let keyA = a.username;
    let keyB = b.username;

    if(keyA < keyB) return -1;
    if(keyA > keyB) return 1;

    return 0;
  });

  return sortArr;
}

function filterDaysForFirstAddress(array: IUserTable[], address: string): IUserTable[] {
  return array.filter(obj => obj.address == address);
}

function filterAndSortWorkers(array: IUserTable[], login: string): IUserTable[] {
  const arrayF: IUserTable[] = array.filter(obj => obj.login == login);
  const arrayS: IUserTable[] = arrayF.sort((a, b) => {
    let keyA = a.day;
    let keyB = b.day;

    return keyA - keyB;
  });

  return arrayS;
}

function fetchStaticData(firstDocument: IUserTable[], documents: IUserTable[]): { username: string, login: string, phones: string[], cranes: string[] } {
  const phones: string[] = documents.map(obj => obj.phone).filter((obj, pos, arr) => arr.indexOf(obj) == pos);
  const cranes: string[] = firstDocument.map(obj => obj.crane).filter((elem, pos, arr) => arr.indexOf(elem) == pos);
  const username: string = firstDocument[0].username;
  const login: string = firstDocument[0].login;

  return { phones, cranes, username, login };
}

function fetchAddressesOfArrayAndRemoveDublicates(array: IUserTable[], prop: string): string[] {
  const addresses: string[] = array.map(obj => obj[prop]);
  const uniqueArr: string[] = addresses.filter((elem, pos) => addresses.indexOf(elem) == pos);

  return uniqueArr;
}

function removeDuplicates(array: IUserTable[], prop: string): IUserNames[] {
  const props: Schema.Types.ObjectId[] = array.map(property => property[prop]);
  const uniqueArr: IUserTable[] = array.filter((obj, pos) => props.indexOf(obj[prop]) == pos);
  const response: IUserNames[] = uniqueArr.map(obj => { 
    const username: IUserNames = {
      _id: obj._id,
      username: obj.username,
      login: obj.login
    };

    return username;
  });

  return response;
}

class TableError extends Error {
  public message: string;

	constructor(message: string) {
		super(...arguments);

		Error.captureStackTrace(this, TableError);
		Object.setPrototypeOf(this, TableError.prototype);

		this.message = message;
	}

	get name() {
		return 'TableError';
	}
}

export { TableError };