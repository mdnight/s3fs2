'use strict';

export default (function() {
       const notImplemented = name => () => {
              throw new Error(`method "${name}" is not implemented`)
       };


       function FsInterface() {}

       let proto = {};
       const methods = [
              'stat',
              'mkdir',
              'readdir',
              'realpath',
              'rmdir',
              'writeFile',
              'appendFile',
              'createReadStream',
              'createWriteStream',
              'unlink',
              'exists',
              'stat',
              'lstat'
       ];
       methods.forEach(method => proto[method] = notImplemented(method));
       FsInterface.prototype = proto;
       return FsInterface;
})();
