/* eslint-disable no-unused-vars */
export const createString =  (str) => {
 return new Promise((resolve, reject) => {
    let result = "";
    let count = 500000;
    for (let i = 0; i < count; i++) {
      result += str;
    }
    resolve(result);
  });
};
