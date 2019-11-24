import { User } from '../models/user';
import { IArchiveMessage } from '../interfaces/IArchiveDocument';
import { Archive, IRoomId } from '../models/archive';
import { Server } from 'http';
import * as socketio from 'socket.io';
import Timeout = NodeJS.Timeout;

export default class Socket {
  private static _connectedSockets: string[];
  private static _io: any;
  private static _timer: Timeout;
  
  public static init(server: Server) {
    this._io = socketio(server);
    this._connectedSockets = [];

    return this._io.on('connection', this.connection.bind(this));
  }

  public static generateRoomId(room: string, idSender: string, idReciever: string): IRoomId | string {
    const roomId: IRoomId = {
      sr: `${idSender}&&${idReciever}`,
      rs: `${idReciever}&&${idSender}`
    };
    
    return room === 'all' ? 'all' : room === 'czech' ? 'czech' : room === 'slovakia' ? 'slovakia' : roomId;
  }
  
  private static async connection(socket: any) {
    let idSender: string;
    let idReciever: string;
    
    if (this._timer)
      clearTimeout(this._timer);

    socket.on('auth', async (id: string, cb: (isUser: boolean) => void) => {
      try {
        const user = await User.findById(id).exec();
        const index = this._connectedSockets.findIndex(sckt => sckt == id);
        
        if (!user)
          return cb(false);

        idSender = user._id;
        socket.join(idSender);

        if (index == -1)
          this._connectedSockets.push(idSender);

        socket.on('disconnect', this.disconnect.bind(this, socket, id));
        socket.on('disconn', this.disconnect.bind(this, socket, id));  

        this._io.emit('conn', this._connectedSockets);
        cb(true);
      } catch (err) {
        cb(false);
      }
    });

    socket.on('join:room', async (pub: boolean, roomId: string) => {
      if (pub)
        return socket.join(roomId);
      
      idReciever = roomId;
      socket.leave('public');
      socket.leave('czech');
      socket.leave('slovakia');
    });
    
    socket.on('send:message', async (room: string, msg: IArchiveMessage) => {
      const { salt, sender, text, time, image } = msg;
      const roomId: string | IRoomId = this.generateRoomId(room, idSender, idReciever);
      const reciever: string = room == 'all' ? 'public' : room == 'czech' || room == 'slovakia' ? room : idReciever; 
      const _sender: string = room == 'all' ? 'all' : room == 'czech' || room == 'slovakia' ? room : idSender;

      await Archive.add(roomId, salt, sender, text, time, image);

      socket.broadcast.to(reciever).emit('get:message', _sender, msg);
    });

    socket.on('remove:message', async (room: string, salt: string) => {
      try {
        const _sender: string = room == 'all' ? 'all' : room == 'czech' || room == 'slovakia' ? room : idSender;
        const reciever: string = room == 'all' ? 'public' : room == 'czech' || room == 'slovakia' ? room : idReciever;
        const roomId: string | IRoomId = this.generateRoomId(_sender, idSender, idReciever);
        const _salt: string = await Archive.delete(roomId, salt);
        
        socket.broadcast.to(reciever).emit('remove:message', _sender, _salt);
      } catch (err) { }
    });

    socket.on('logout', () => {
      let index: number = this._connectedSockets.findIndex(sckt => sckt == idSender);
        
      if (index >= 0)
        this._connectedSockets.splice(index, 1);
      
      socket.leave(idSender);
      socket.leave('public');

      this._io.emit('disconn', idSender);
    });

    return this._io;
  }

  private static disconnect(socket, idSender) {
    let index = this._connectedSockets.findIndex(sckt => sckt == idSender);
    
    if (index >= 0)
      this._connectedSockets.splice(index, 1);
    
    socket.leave(idSender);
    socket.leave('public');

    this._timer = setTimeout(() => {
      this._io.emit('disconn', idSender);
    }, 1000 * 10);
  }
}