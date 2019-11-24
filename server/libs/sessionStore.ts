import * as mongoose from 'mongoose';
import * as session from 'express-session';
import * as connectMongo from 'connect-mongo';

const MongoStore = connectMongo(session);
const sessionStore = new MongoStore({mongooseConnection: mongoose.connection});

export default sessionStore;