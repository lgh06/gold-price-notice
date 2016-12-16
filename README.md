### Gold price monitor.Send mail automatically.

### Usage
Fill in ```config.js```  
You could get send email API from http://sendcloud.sohu.com/,  
or it will send mail using ```sendmail```.  

Set range in ```range.json```.

### view in browser
```http://localhost:8401/low/1000/high/2000```  can set range to 1000-2000,  
but not stored in range.json  

```http://localhost:8401/``` to view current gold price.

### dev mode  
comment ```console.log=()=>{};``` line.  
