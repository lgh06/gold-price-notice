var request = require('request');
//var MD5 = require('./tool').MD5;
var moment = require('moment');
var sendmail = require('sendmail')({silent: true});

//var share_api = 'http://quote.fx678.com/symbo?exchName=WGJS&symbol=XAU';
var share_api = 'http://api.q.fx678.com/quotes.php?exchName=WGJS&symbol=XAU';

var req_url = share_api+'&st='+Math.random();

var current_price = 0;

//console.log=()=>{};   //comment this line in dev.

function getPrice(cb){
  request(req_url, function (error, response, body) {
    if (!error && response.statusCode == 200) {// 服务器股票接口有响应
      var obj = JSON.parse(body);
      if(obj.s == 'ok' && obj.c && obj.c[0]){ //返回了金价字段
        var p = obj.c[0];
        current_price = p;
        console.log('金价:'+p);
        if(p < price_config.low || p > price_config.high){ //到达报警值
          cb(obj.c[0]);
        }
      }
    }
  });
};

var mail_config = require('./config').sohu;
var price_config = require('./range');

var genTxt = (price) => ({
  apiUser:mail_config.apiuser1,
  apiKey:mail_config.apikey,
  from:'ccc@mail.hapleo.com',
  fromName:'欢欢',
  to:'hnnk@qq.com',
  subject:`当前伦敦金价： ${price}`,
  plain:`当前伦敦金价： ${price},已超出告警值${price_config.low}-${price_config.high}`
});

var last_sent_time = 0;
var last_sent_time2 = 0;
function sendMail(price) {
  var txt = genTxt(price);
  var now = Date.now();
  if(now - last_sent_time > 20*60*1000){ //上次发送距现在20分钟
    request.post({url:'http://api.sendcloud.net/apiv2/mail/send',form:txt},function (error, response, body) {
      if (!error && response.statusCode == 200) { //请求送达 sohu服务器响应
        var obj = JSON.parse(body);
        if(obj.result == 1 && obj.statusCode == 200){ //sohu服务器响应正确返回码
          last_sent_time = Date.now();
          console.log(`sohu mail sent at ${moment(last_sent_time).format('YYYYMMDD-HH:mm:ss')}`)
        }
      }
    });
  }else{
    console.log(`触发告警，但不足二十分钟,${moment(now).format('YYYYMMDD-HH:mm:ss')}`)
    if(now - last_sent_time2 > 2*60*1000){ //自制邮件 2分钟发一次
      sendmail({
          from: 'ccc@hapleo.com',
          to: 'hnnk@qq.com',
          subject: txt.subject,
          text: txt.plain,
        }, function(err, reply) {
          last_sent_time2 = Date.now();
          console.log(`self mail sent at ${moment(last_sent_time2).format('YYYYMMDD-HH:mm:ss')}`)
      });
    }
  }

}

var iid = setInterval(()=>{
  getPrice((price)=>{
    sendMail(price);
  });
},40*1000); //四十秒查询一次金价接口

var express = require('express');
var app = express();

app.get('/', function (req, res) {
  res.send(`gold monitor is running,gold price is ${current_price || 0}`);

});

app.get('/low/:low/high/:high', function (req, res) {
  price_config = req.params;
  res.send('set to '+JSON.stringify(price_config));

});

app.listen(8401, function () {
  console.log('monitor running on port 8401!')
});
