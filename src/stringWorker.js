/* eslint-disable no-unused-vars */

import {createString} from "./data.js"
self.onmessage = async(event) => {
   let str =   await stringList();
   self.postMessage(str);
}

const stringList = async () => {
  return [
    await createString("a"), // 500 kb // 1
    await createString("b"), // 500 kb // 2
    await createString("c"), // 500 kb // 3
    await createString("d"), // 500 kb // 4
    await createString("e"), // 500 kb // 5
    await createString("f"), // 500 kb // 6
    await createString("g"), // 500 kb // 7
    await createString("h"), // 500 kb // 8
    await createString("i"), // 500 kb // 9
    await createString("j"), // 500 kb // 10
    await createString("k"), // 500 kb // 11
    await createString("l"), // 500 kb // 12
  ];
};