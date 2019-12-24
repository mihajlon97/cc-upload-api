const { ReE, ReS, to, TE }         = require('../services/UtilService');
const axios                        = require('axios');
const formidable                   = require('formidable');
const sharp                        = require('sharp');

/**
 * Upload endpoint
 */
const upload = async function(req, res){
	let form = new formidable.IncomingForm();

	form.parse(req, function(err, fields, files) {
		const file = sharp(files.file.path);
		const xLimit = Math.floor(width / 2);
		const yLimit = Math.floor(height / 2);
		try {
			file.metadata().then(function ({ width, height, format}) {
				// Top left
				file.extract({
					left: 0,
					top: 0,
					width: xLimit,
					height: yLimit
				}).toFile('1.jpg', function (err) {
					if (err) TE(err);
				});

				// Top right
				file.extract({
					left: xLimit,
					top: 0,
					width: xLimit,
					height: yLimit
				}).toFile('2.jpg', function (err) {
					if (err) TE(err);
				});

				// Bottom left
				file.extract({
					left: 0,
					top: yLimit,
					width: xLimit,
					height: yLimit
				}).toFile('3.jpg', function (err) {
					if (err) TE(err);
				});

				// Bottom right
				file.extract({
					left: xLimit,
					top: yLimit,
					width: xLimit,
					height: yLimit
				}).toFile('4.jpg', function (err) {
					if (err) TE(err);
				});

				return ReS(res, {message: 'Success', width, height, format});
			})
		} catch (err) {
			return ReE(res, err);
		}
	});
	return;

	const body = req.body;
	console.log(req.file, req.files);
	if (!body.files)
		return ReE(res, { message: 'INVALID_DATA' });

	return ReS(res, {message: 'Success'});


	// Ping Service Registry (cPanel) to get location of service with that id
	let [err, response] = await to(axios.get('http://cpanel:1234/sections/' + body.section));
	if (err) return ReE(res, err);

	// Forward persons to right section and use location(address) from service registry
	let sectionAddress = response.data.section.address;
	[err, response] = await to(axios.post(sectionAddress + '/persons', {
		persons: body.persons
	}));
	if (err) return ReE(res, err);
	return ReS(res, {message: 'Success'});
};
module.exports.upload = upload;
