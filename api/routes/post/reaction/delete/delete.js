
const express = require('express');
const fs = require('fs');
const url = require('url');
const events = require('events');
const request = require('request');

const JWTToken = require('./../../../../../jwt_token');
const database = require('./../../../../../database');
const logger = require('./../../../../../tunnel/logger');

const router = express.Router();

router.get('/', function (req, res) {
    res.writeHead(200, {'Content-Type':'text/html'});
    const find = url.parse(req.url, true).query;

    if (find.page == 'example') {
        return res.end(fs.readFileSync(__dirname+'/fg_delete.json'));
    }

    return fs.readFile(__dirname+'/delete.html', function (err, data) {
        if (!err) {
            return res.end(data);    
        }

        return res.status(404).end('404 Not found.');
    });
});

router.post('/', JWTToken.middle(), function (req, res) {
    const fg = JSON.parse(fs.readFileSync(__dirname+'/fg_delete.json'));
    const body = req.body;

    const input = {user_id: body.user_id, reaction_id: body.reaction_id};
    const output = fg.output;

    const emitter = new events.EventEmitter();

    emitter.on('delete', function (_attach_) {
        const sql = "DELETE FROM reaction WHERE r_id=? AND r_user_id=?";

        database.query(sql, [input.reaction_id, input.user_id], function (err, result) {
            if (err) {
                return emitter.emit('response', {
                    status: 0,
                    descript: 'เกิดข้อผิดพลาดบางอย่าง!',
                    err: err
                });
            }

            const deleted = result.affectedRows;

            if (deleted != 0) {
                return emitter.emit('response', {
                    status: 1, 
                    descript: 'ลบการถูกใจสำเร็จแล้ว'
                });
            } else {
                return emitter.emit('response', {
                    status: 0, 
                    descript: 'ลบการถูกใจไม่สำเร็จ!'
                });
            }
        });
    });

    emitter.on('response', function (_attach_) {
        output.status = _attach_.status;
        output.descript = _attach_.descript;
        output.error = _attach_.err;
        output.data = _attach_.data;

        return res.status(200).json(output);
    });

    return emitter.emit('delete', {});
});

module.exports = router;