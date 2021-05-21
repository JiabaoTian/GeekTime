/**
 * css 样式预处理
 * @param {Object} element dom树
 */
function getStyle(element) {
    // 初始化style
    if (!element.style) {
        element.style = {};
    }
    for (let prop in element.computedStyle) {
        console.log(prop);
        let p = element.computedStyle.value;
        element.style[prop] = element.computedStyle[prop].value;

        if (element.style[prop].toString().match(/px$/)) {
            element.style[prop] = parseInt(element.style[prop]);
        }
        if (element.style[prop].toString().match(/^[0-9\.]$/)) {
            element.style[prop] = parseInt(element.style[prop]);
        }
    }
    return element.style;
}

/**
 * 
 * @param {Object} element dom树 
 * 
 */
function layout(element) {
    // 如果元素没有computedStyle属性就返回
    if (!element.computedStyle) {
        return;
    }
    let elementStyle = getStyle(element);

    if (elementStyle.display !== 'flex') {
        return;
    }

    // TODO  过滤element元素
    let items = element.children.filter(e => e.type === 'element');

    items.sort((a, b) => {
        return (a.order || 0) - (b.order || 0);
    });
    console.log(items);

    let style = elementStyle;

    // 初始化width ，heigh
    ['width', 'height'].forEach(size => {
        if (style[size] === 'auto' || style[size] === '') {
            style[size] === null;
        }
    });
    /** 
     * 初始化 flex-direction , align-items , justify-content, flex-wrap, align-content
     */
    if (!style.flexDirection || style.flexDirection === 'auto') {
        style.flexDirection = 'row';
    }
    if (!style.alignItems || style.alignItems === 'auto') {
        style.alignItems = 'stretch';
    }
    if (!style.justifyContent || style.justifyContent === 'auto') {
        style.justifyContent = 'flex-start';
    }
    if (!style.flexWrap || style.flexWrap === 'auto') {
        style.flexWrap = 'nowrap';
    }
    if (!style.alignContent || style.alignContent === 'auto') {
        style.alignContent = 'stretch';
    }

    let mainSize, mainStart, mainEnd, mainSign, mainBase,
        crossSize, crossStart, crossEnd, crossSign, crossBase;

    // 从左到右 从上到下
    if (style.flexDirection === 'row') {
        mainSize = 'width';
        mainStart = 'left';
        mainEnd = 'right';
        mainSign = +1;
        mainBase = 0;

        crossSize = 'height';
        crossStart = 'top';
        crossEnd = 'bottom';
    }
    // 从右向左，从上到下
    if (style.flexDirection == 'row-reverse') {
        mainSize = 'width';
        mainStart = 'right';
        mainEnd = 'left';
        mainSign = -1;
        mainBase = style.width;


        crossSize = 'height';
        crossStart = 'top';
        crossEnd = 'bottom';
    }

    // 从上到下，从左从右    
    if (style.flexDirection === 'column') {
        mainSize = 'height';
        mainStart = 'top';
        mainEnd = ' bottom';
        mainSign = +1;
        mainBase = 0;


        crossSize = 'width';
        crossStart = 'left';
        crossEnd = 'right';
    }

    // 从下到上，从左从右    
    if (style.flexDirection === 'column-reverse') {
        mainSize = 'height';
        mainStart = 'bottom';
        mainEnd = ' top';
        mainSign = -1;
        mainBase = style.height;


        crossSize = 'width';
        crossStart = 'left';
        crossEnd = 'right';
    }

    if (style.flexWrap === 'wrap-reverse') {
        [crossStart, crossEnd] = [crossEnd, crossStart];
        crossSize = -1
    } else {
        crossBase = 0;
        crossSize = 1;
    }

    let isAutoMainSize = false;
    if (!style[mainSize]) { //  父元素未设置宽度
        elementStyle[mainSize] = 0;
        for (let i = 0; i < items.length; i++) {
            let item = items[i];
            console.log(item);
            // TODO  有坑? void 0 === undefined   undefined 局部可以被重写
            if (item.style[mainSize] !== null || item.style[mainSize] !== (void 0)) {
                elementStyle[mainSize] = elementStyle[mainSize] + item.style[mainSize];
            }
        }
        isAutoMainSize = true;
    }

    let flexLine = []; // 单行
    let flexLines = [flexLine];

    let mainSpace = elementStyle[mainSize]; // 父元素实际宽度
    let crossSpace = 0; //  行高默认为0


    for (let i = 0; i < items.length; i++) {
        let item = items[i];
        let itemStyle = getStyle(item);

        // 如果元素未设置宽度， 默认给0
        if (itemStyle[mainSize] === null) {
            itemStyle[mainSize] = 0;
        }

        if (itemStyle.flex) {
            flexLine.push(item);
        } else if (style.flexWrap === 'nowrap' && isAutoMainSize) {
            // 不换行， 且宽度auto
            mainSpace -= itemStyle[mainSize]; // 父宽度 
            if (itemStyle[crossSize] !== null && itemStyle[crossSize] !== (void 0)) {
                // 比较父元素和自元素行高
                crossSpace = Math.max(crossSpace, itemStyle[crossSize]);
            }
            flexLine.push(item); // 将元素放入行内
        } else {
            if (itemStyle[mainSize] > style[mainSize]) {
                // 子元素宽度 > 父元素宽度；
                itemStyle[mainSize] = style[mainSize]
            }
            if (mainSpace < itemStyle[mainSize]) {
                // 父元素空间 < 子元素宽度； 新建一行
                flexLine.mainSpace = mainSpace; // 将宽高赋值给行元素
                flexLine.crossSpace = crossSpace;

                flexLine = [item];
                flexLines.push(flexLine);
                mainSpace = style[mainSize];
                crossSpace = 0;
            } else {
                flexLine.push[item];
            }
            if (itemStyle[crossSize] !== null && itemStyle[crossSize] !== (void 0)) {
                crossSpace = Math.max(crossSpace, itemStyle[crossSize]);
            }
            // 父元素空间 - 子元素宽度
            mainSpace -= itemStyle[mainSize];
        }
    }
    flexLine.mainSpace = mainSpace;

    // 不换行或者width:auto的情况下保存cross高度
    if (style.flexWrap === 'nowrap' && isAutoMainSize) {
        flexLine.crossSpace = (style[crossSize] !== undefined) ? style[crossSize] : crossSpace;
    } else {
        flexLine.crossSpace = crossSpace;
    }
    // 如果子元素实际宽度超出父元素宽度， 将对子元素等比压缩， flex：value 属性将被压缩至0
    if (mainSpace < 0) {
        // 计算压缩比例
        let scale = style[mainSize] / (style[mainSize] - mainSpace);
        let currentMain = mainBase;
        // 遍历子元素获取子元素属性并计算
        for (let i = 0; i < items.length; i++) {
            let item = items[i];
            let itemStyle = getStyle(item); // 获取子元素样式
            // 如果子元素存在flex属性，则with为0
            if (itemStyle.flex) {
                itemStyle[mainSize] = 0;
            }
            // 如果不存在，则将子元素宽度等比压缩
            itemStyle[mainSize] = itemStyle[mainSize] * scale;
            // 将起始定位的值赋给子元素
            itemStyle[mainStart] = currentMain;
            // 将末尾定位的值赋给子元素
            itemStyle[mainEnd] = itemStyle[mainStart] + mainSize * itemStyle[mainSize];
            currentMain = itemStyle[mainEnd];
        }
    } else {
        // mainSpace 如果大于 0
        flexLines.forEach(items => {
            let mainSpace = items.mainSpace;
            let flexTotal = 0; // 当前行flex 等分数量 计数
            // 计算子元素中含有flex属性的数量
            for (let i = 0; i < items.length; i++) {
                let item = items[i];
                let itemStyle = getStyle(item);
                if ((itemStyle.flex !== null) && (itemStyle.flex !== (void 0))) {
                    flexTotal += itemStyle.flex;
                    continue;
                }
            }
            // flexTotal > 0 将等分剩余的mainSpace
            if (flexTotal > 0) {
                let currentMain = mainBase;
                for (let i = 0; i < items.length; i++) {
                    let item = items[i];
                    let itemStyle = getStyle(item);
                    if (itemStyle.flex) {
                        itemStyle[mainSize] = (mainSpace / flexTotal) * itemStyle.flex;
                    }
                    item[mainStart] = currentMain;
                    item[mainEnd] = itemStyle[mainStart] + mainSize * itemStyle[mainSize];
                    currentMain = itemStyle[mainEnd];
                }
            } else {
                if (style.justifyContent === 'flex-start') {
                    let currentMain = mainBase;
                    let step = 0;
                } else if (style.justifyContent === 'flex-end') {
                    let currentMain = mainSpace * mainSign + mainBase;
                    let step = 0;
                }
                if (style.justifyContent === 'center') { // 2个单位s距离
                    let currentMain = mainSpace / 2 * mainSign + mainBase;
                    let step = 0;
                }
                if (style.justifyContent === 'space-between') { //length-1个单位距离
                    let step = mainSpace / (items.length - 1) * mainSign;
                    let currentMain = step / 2 + mainBase;
                }
                if (style.justifyContent === 'space-around') { // length个单位距离
                    let step = mainSpace / (items.length) * mainSign;
                    let currentMain = step / 2 + mainBase;
                }
                for (let i = 0; i < items.length; i++) {
                    let item = items[i];
                    // itemStyle = getStyle(item);
                    itemStyle[mainStart, currentMain];
                    itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize];
                    currentMain = itemStyle[mainEnd] + step;
                }
            }
        })
    }
    // 定义交叉轴高度空间
    // 如果crossSpace不存在，将所有元素的子元素crossSize求和
    if (!style[crossSize]) {
        crossSpace = 0;
        elementStyle[crossSize] = 0; // 设置crossSize为空
        //遍历所有行， 将当前元素的所有crossSize求和
        for (let i = 0; i < flexLines.length; i++) {
            elementStyle[crossSize] = elementStyle[crossSize] + flexLine[i].crossSpace;
        }
    } else { // 如果存在，将元素总高度 - 每个元素的crossSpace
        crossSpace = style[crossSize];
        for (let i = 0; i < flexLines.length; i++) {
            crossSpace -= flexLines[i].crossSpace;
        }
    }

    if (style.flexWrap === 'wrap-reverse') {
        // 从底部开始排列 crossBase = 父元素高度
        crossBase = style[crossSize];
    } else {
        crossBase = 0;
    }

    // 每行行高；
    let lineSize = style[crossSize] / flexLines.length;
    let step;

    if (style.alignContent === 'flex-start') {
        crossBase += 0;
        step = 0;
    }

    if (style.alignContent === 'flex-end') {
        crossBase += crossSign * crossSpace;
        step = 0;
    }

    if (style.alignContent === 'center') {
        crossBase += crossSign * crossSpace / 2;
        step = 0;
    }

    if (style.alignContent === 'space-between') {
        crossBase += 0;
        step = crossSpace / (flexLines.length - 1);
    }

    if (style.alignContent === 'space-around') {
        step = crossSpace / (flexLines.length);
        crossBase += crossSign * step / 2;
    }

    if (style.alignContent === 'stretch') {
        crossBase += 0;
        step = 0;
    }

    flexLines.forEach((items) => {
        let lineCrossSize = style.alignContent === 'stretch' ?
            items.crossSpace + crossSpace / flexLines.length :
            items.crossSpace;

        for (let i = 0; i < items.length; i++) {
            let item = items[i];
            let itemStyle = getStyle(item);
            //获取当前元素align-items状态， 如果不存在，获取父元素样式
            let align = itemStyle.alignSelf || style.alignItems;

            if (item === null) {
                // stretch 状态处理
                itemStyle[crossSize] = (align === 'stretch') ?
                    lineCrossSize : 0;
            }

            if(align === 'flex-start'){
                itemStyle[crossStart] = crossBase;
                itemStyle[crossEnd] = itemStyle[crossStart] + crossSign * itemStyle[crossSize];
            }

            if(align === 'flex-end'){
                itemStyle[crossEnd] = crossBase + crossSign * lineCrossSize;
                itemStyle[crossStart] = itemStyle[crossEnd] - crossSign * itemStyle[crossSize];
            }

            if(align === 'center'){
                itemStyle[crossStart] = crossBase + crossSign * (lineCrossSize - itemStyle[crossSize])/2;
                itemStyle[crossEnd] = itemStyle[crossStart] + crossSign * itemStyle[crossSize];
            }

            if(align === 'stretch'){
                itemStyle[crossStart] = crossBase;
                itemStyle[crossEnd] = crossBase + crossSign * ((itemStyle[crossSize] !== null && itemStyle[crossSize] !== (void 0))?
                    itemStyle[crossSize]: lineCrossSize);
                itemStyle[crossSize] = crossSign * (itemStyle[crossEnd] - itemStyle[crossStart])
            }
        }
        crossBase += crossSign*(lineCrossSize + step);
    });
}


module.exports = layout;