import * as nconf from 'nconf';
import * as path from 'path';

nconf.argv()
  	  .env()
     .file({ file: path.join(__dirname, 'config.json')});

export default nconf;