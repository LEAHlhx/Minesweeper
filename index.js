//获取DOM节点
let canv = document.getElementById('mycanv');
let ctx = canv.getContext('2d');
let gnav = document.getElementById('gnav');
let mine_total = document.getElementById('mine_total');

//初始化游戏变量
let levels = [[9, 9, 10], [16, 16, 40], [16, 30, 99]];
let level = levels[0];
let g_arr = [];
let g_obj = {};
let g_color = { block: '#369', open: '#ddd', mine: '#69d', highlight: '#89f', bomb: '#a33' }
let mine = ['💣', '🚩', '❔', '💥'];
let mine_arr = [];
let count = 0;
let gameover = false;
let timer = 0;
g_init(0);
function g_init(n) {
    level = n == undefined ? level : levels[n];
    g_arr = [];
    mine_arr = [];
    count = 0;
    timer = 0;
    gameover = false;
    canv.width = level[1] * 50;
    canv.height = level[0] * 50;
    gnav.style.width = level[1] * 50 + 'px';
    mine_total.value = level[2];
    ctx.clearRect(0, 0, level[1] * 50, level[0] * 50)
    for (let i = 0; i < level[0]; i++) {
        for (let j = 0; j < level[1]; j++) {
            let xy = j + '-' + i;
            g_arr.push(xy);
            g_obj[xy] = { mark: 0, open: 0 };
            drawBlock(xy, g_color.block);
        }
    }
    setMine();
}
//随机布雷
function setMine() {
    //随机排序选取前level[2]个
    let new_arr = g_arr.map(i => ({ v: i, r: Math.random() }));
    new_arr.sort((a, b) => a.r - b.r);
    mine_arr = new_arr.map(i => i.v).slice(0, level[2])
    mine_arr.forEach(n => {
        g_obj[n].mark = -1;
        let around = getAround(n);
        around.forEach(xy => {
            if (g_obj[xy].mark != -1) {
                g_obj[xy].mark++;
            }
        });
    });
}
//绘制
function drawBlock(xy, c) {
    let w = 50, r = 6, m = 2;//宽，圆角，外边距
    let [x, y] = xy.split('-').map(n => n * w);
    ctx.save();
    ctx.clearRect(x, y, w, w);
    ctx.beginPath();
    ctx.moveTo(x, y + r);
    ctx.arcTo(x, y + w - m, x + w - m, y + w - m, r);
    ctx.arcTo(x + w - m, y + w - m, x + w - m, y, r);
    ctx.arcTo(x + w - m, y, x, y, r);
    ctx.arcTo(x, y, x, y + w - m, r);
    ctx.fillStyle = c;
    ctx.fill();
    ctx.restore();

}

//显示文本
function markText(xy, txt) {
    let [x, y] = xy.split('-').map(n => n * 50);
    ctx.save();
    ctx.font = '16px Arial';
    ctx.fillStyle = '#f96';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(txt, x + 25, y + 25);
    ctx.restore();
}

//获取周边方块
function getAround(xy) {
    let [x, y] = xy.split('-').map(n => n * 1);
    let around = [];
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            let id = `${x + j}-${y + i}`;
            if (g_arr.includes(id) && id !== xy) {
                around.push(id);
            }
        }
    }
    return around;
}

//鼠标事件：简单实现扫雷
canv.addEventListener('click', openBlock)
canv.addEventListener('contextmenu', markMine);
function openBlock(ev) {
    if (gameover) {
        return;
    }
    if (timer == 0) {
        timer = new Date();
    }
    let x = Math.floor(ev.offsetX / 50);
    let y = Math.floor(ev.offsetY / 50);
    let xy = x + '-' + y;
    if (g_obj[xy].open != 0) {
        return;
    }
    g_obj[xy].open = 1;
    drawBlock(xy, g_color.open);
    markText(xy, g_obj[xy].mark);
    if (g_obj[xy].mark == 0) {
        openZero(xy);
    } else if (g_obj[xy].mark == -1) {
        //触雷，挑战失败
        drawBlock(xy, g_color.bomb);
        markText(xy, mine[0]);
        markText(xy, mine[3]);
        checkOver();
    };
}
//遍历打开所有安全的方块
function openZero(xy) {
    let around = getAround(xy);
    around.forEach(n => {
        if (g_obj[n].open == 0) {
            g_obj[n].open = 1
            drawBlock(n, g_color.open);
            markText(n, g_obj[n].mark);
            if (g_obj[n].mark == 0) {
                openZero(n);
            }
        }
    })
}
function markMine(ev) {
    ev.preventDefault();
    if (gameover) {
        return;
    }
    if (timer == 0) {
        timer = new Date();
    }
    let x = Math.floor(ev.offsetX / 50);
    let y = Math.floor(ev.offsetY / 50);
    let xy = x + '-' + y;
    if (g_obj[xy].open == 1) {
        return;
    }
    if (g_obj[xy].open == 0) {
        g_obj[xy].open = -1;
        drawBlock(xy, g_color.mine);
        markText(xy, mine[1]);
        count++;
        mine_total.value = level[2] - count;
        if (count == level[2]) {
            checkOver();
        }
    } else if (g_obj[xy].open == -1) {
        g_obj[xy].open = 2;
        drawBlock(xy, g_color.mine);
        markText(xy, mine[2]);
        count--;
        mine_total.value = level[2] - count;
    } else if (g_obj[xy].open == 2) {
        g_obj[xy].open = 0;
        drawBlock(xy, g_color.block);
    }
}

function checkOver() {
    gameover = true;
    let timer2 = new Date();
    let durtime = ((timer2 - timer) / 1000).toFixed(1);
    let win = mine_arr.every(n => g_obj[n].open == g_obj[n].mark);
    setTimeout(() => {
        let next = confirm(win ? '恭喜胜利！\n耗时：' + durtime + '秒' : '挑战失败！');//如果点击确定，则自动进入下一局，布局和本轮一样
        if (next) {
            g_init();
        }
    }, 100);
}

//1.按下鼠标，高亮周边，松开鼠标，取消高亮
//2.辅助扫雷，对于明确的雷块或安全的方块进行标注或打开
canv.addEventListener('mousedown', highLight)
canv.addEventListener('mouseup', highLight)
canv.addEventListener('mouseup', supGame)
function highLight(ev) {
    if (gameover) {
        return;
    }
    let x = Math.floor(ev.offsetX / 50);
    let y = Math.floor(ev.offsetY / 50);
    let xy = x + '-' + y;
    if (g_obj[xy].open != 1) {
        return;
    }
    let color = ev.type == 'mousedown' ? g_color.highlight : g_color.block;//合并多余代码
    getAround(xy).forEach(n => {
        if (g_obj[n].open == 0) {
            drawBlock(n, color);
        }
    });
}
/* function unhighLight(ev) {
    let x = Math.floor(ev.offsetX / 50);
    let y = Math.floor(ev.offsetY / 50);
    let xy = x + '-' + y;
    if (g_obj[xy].open != 1) {
        return;
    }
    getAround(xy).forEach(n => {
        if (g_obj[n].open == 0) {
            drawBlock(n, g_color.block);
        }
    })
} */
function supGame(ev) {
    if (gameover) {
        return;
    }
    let x = Math.floor(ev.offsetX / 50);
    let y = Math.floor(ev.offsetY / 50);
    let xy = x + '-' + y;
    if (g_obj[xy].open != 1) {
        return;
    }
    let mark = g_obj[xy].mark;
    let marked_mine = 0;
    let unopen = 0;
    let around = getAround(xy);
    around.forEach(n => {
        if (g_obj[n].open == -1) {
            marked_mine++;
        }
        if (g_obj[n].open == 0) {
            unopen++;
        }
    })
    around.forEach(n => {
        if (g_obj[n].open == 0) {
            if (mark == marked_mine) {
                g_obj[n].open = 1;
                drawBlock(n, g_color.open);
                markText(n, g_obj[n].mark);
                if (g_obj[n].mark == 0) openZero(n);
                if (g_obj[n].mark == -1) {//自动扫雷时如果标注错误，扫到雷了应该显示并结束
                    drawBlock(n, g_color.bomb);
                    markText(n, mine[0]);
                    markText(n, mine[3]);
                    checkOver();
                }
            } else if (mark - marked_mine == unopen) {
                g_obj[n].open = -1;
                drawBlock(n, g_color.mine);
                markText(n, mine[1]);
                count++;
                mine_total.value = level[2] - count;
                if (count == level[2]) {
                    checkOver();
                }
            }
        }
    })
}
