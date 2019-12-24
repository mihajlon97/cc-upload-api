const {to} = require('await-to-js');
const pe = require('parse-error');

module.exports.to = async (promise) => {
    let err, res;
    [err, res] = await to(promise);
    if(err) return [pe(err)];

    return [null, res];
};

// Error Web Response
module.exports.ReE = function(res, err, code){
    if(typeof err == 'object' && typeof err.message != 'undefined'){
        err = err.message;
    }

    if(typeof code !== 'undefined') res.statusCode = code;
    console.log(err)
    return res.json({success:false, error: err});
};

// Success Web Response
module.exports.ReS = function(res, data, code){
    let send_data = {success:true};

    if(typeof data == 'object'){
        // Merge the objects
        send_data = Object.assign(data, send_data);
    }

    if(typeof code !== 'undefined') res.statusCode = code;

    return res.json(send_data)
};

// TE stands for Throw Error
module.exports.TE = function(err_message, log){
    if(log === true){
        console.error(err_message);
    }

    throw new Error(err_message);
};

/**
 * Normal array.forEach method from js is not synchronous
 * This function make "callback" run for each element in array synchronously
 * @param array
 * @param callback
 */
module.exports.asyncForEach = async function (array, callback) {
	for (let index = 0; index < array.length; index++) {
		await callback(array[index], index, array);
	}
};
