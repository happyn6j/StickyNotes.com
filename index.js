var app = {
    util: {},
    store: {}//文件仓库
};
//工具A方法模块
app.util = {
    $: function (selector, node) {
        return (node || document).querySelector(selector);
    },
    formatTime: function getNowFormatDate(ms) {
        var date = new Date(ms);//毫秒
        var seperator1 = "-";
        var seperator2 = ":";
        var month = date.getMonth() + 1;
        var strDate = date.getDate();
        if (month >= 1 && month <= 9) {
            month = "0" + month;
        }
        if (strDate >= 0 && strDate <= 9) {
            strDate = "0" + strDate;
        }
        var currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate
            + " " + date.getHours() + seperator2 + date.getMinutes()
            + seperator2 + date.getSeconds();
        console.log(currentdate);
        return currentdate;
    }
};
//store模块
app.store = {
    __store_key: '__sticky_note__',
    get: function (id) {
        var notes = this.getNotes();
        return notes[id] || {};
    },
    set: function (id, content) {
        var notes = this.getNotes();
        if (notes[id]) {
            //加载一个新的文档
            Object.assign(notes[id], content);
        } else {
            notes[id] = content;
        }
        //JSON.stringify() 方法用于将 JavaScript 值转换为 JSON 字符串。
        localStorage[this.__store_key] = JSON.stringify(notes);
        console.log('save note! id:'+id+' content:'+JSON.stringify(notes))
    },
    remove:function(id){
        var notes = this.getNotes();
        delete notes[id];
        localStorage[this.__store_key] = JSON.stringify(notes);
    },
    getNotes: function () {
        //在客户端存储数据,没有时间限制的数据存储
        return JSON.parse(localStorage[this.__store_key]|| '{}');
    }
};
(function (util, store) {
    var $ = util.$;
    var moveNote = null;
    var startX;
    var startY;
    var maxIndex = 0;
    var noteTpl =
        '<button class="btn_delete">x</button><div class="editor" contenteditable="true"></div><div class="time"><span>update&nbsp;:&nbsp;</span><span class="datetime"></span></div>';

    function Note(options) {
        var note = document.createElement("div");
        note.className = "note";
        note.id = options.id || "m_note_" + Date.now();
        note.innerHTML = noteTpl;
        $('.editor', note).innerHTML = options.content ||'';
        note.style.left = options.left + 'px';
        note.style.top = options.top + 'px';
        note.style.zIndex = options.zIndex;
        note.style.background=parseInt(Math.random*300);
        document.body.appendChild(note);
        this.note = note;
        this.updateTime(options.updateTime);
        this.addEvent();
    }

    Note.prototype.close = function (e) {
        console.log("close");
        document.body.removeChild(this.note);
    }

    Note.prototype.addEvent = function (e) {
        //mousedown事件
        var mousedownHandler = function (e) {
            moveNote = this.note;
            startX = e.clientX - this.note.offsetLeft;
            startY = e.clientY - this.note.offsetTop;
            //console.log(startX+' '+startY);
            if (parseInt(this.note.zIndex) !== maxIndex - 1) {
                this.note.style.zIndex = maxIndex++;
                store.set(this.note.id,{
                    zIndex:maxIndex-1
                })
            }
        }.bind(this);
        this.note.addEventListener('mousedown', mousedownHandler);

        //便签的输入事件
        var editor = $('.editor', this.note);
        var inputTimer;//输入完成是的时间
        var editorHandler = function (e) {
            var content = editor.innerHTML;
            clearTimeout(inputTimer);
            inputTimer = setTimeout(function () {
                store.set(this.note.id,{
                    content:content
                });
            }.bind(this), 300);//延缓函数调用频率
        }.bind(this);
        this.note.addEventListener('input', editorHandler);

        //移除元素时顺便移除事件,关闭处理程序
        var btn_delete = $('.btn_delete', this.note);
        var closeHandler = function (e) {
            store.remove(this.note.id);
            this.close(e);
            btn_delete.removeEventListener('click', closeHandler);
            this.note.removeEventListener('mousedown', mousedownHandler);
        }.bind(this);
        btn_delete.addEventListener('click', closeHandler);
    }
    //更新时间
    Note.prototype.updateTime = function (ms) {
        var ts = $('.datetime', this.note);
        var ms = ms || Date.now();
        ts.innerHTML = util.formatTime(ms);
        this.updateTimeInMs=ms;
    }

    Note.prototype.save = function () {
        store.set(this.note.id, {
            left: this.note.offsetLeft,
            top: this.note.offsetTop,
            zIndex: parseInt(this.note.style.zIndex),
            content: $('.editor', this.note).innerHTML,
            updateTime: this.updateTimeInMs
        })
    }
    document.addEventListener('DOMContentLoaded', function (e) {
        $('.btn_add').addEventListener('click', function (e) {
            var note=new Note({
                left: Math.round(Math.random() * (window.innerWidth - 250)),
                top: Math.round(Math.random() * (window.innerHeight - 300)),
                zIndex: maxIndex++,
            });
            note.save();
        });

        //移动监听
        function mousemoveHandler(e) {
            if (!moveNote) {
                return;
            }
            moveNote.style.left = e.clientX - startX + 'px';
            moveNote.style.top = e.clientY - startY + 'px';

        }

        function mouseupHandler(e) {
            if(!moveNote){
                return;
            }
            store.set(moveNote.id,{
                left:moveNote.offsetLeft,
                top:moveNote.offsetTop
            });
            moveNote = null;
        }

        document.addEventListener('mousemove', mousemoveHandler);
        document.addEventListener('mouseup', mouseupHandler);

        //初始化note
        var notes = store.getNotes();
        Object.keys(notes).forEach(function (id) {
            var options=notes[id];
            if(maxIndex<options.zIndex){
                maxIndex=options.zIndex
            }
            new Note(Object.assign(notes[id], {
                id: id
            }))
        })
    });
})(app.util, app.store);