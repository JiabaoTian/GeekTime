const layout = require('./layout.js');

const css = require('css');

let currentToken = null;   // 全局状态
let currentAttribute = null;
let currentTextNode = null;
let stack =  [
    {
        type: 'document',
        children: []
    }
]
/** 加入新函数，addCSSRules 这里把css规则暂存到数组里 */ 
let rules = [];
function addCSSRules(text){
    let ast = css.parse(text);
    rules.push(...ast.stylesheet.rules);
}


/** # id选择器 . class选择器  div tagName选择器 */
function match(el,selector){
  if(!selector || !el.attributes){
    return false;
  }

  if(selector.charAt(0) === '#'){
    let attr = el.attributes.filter(attr => attr.name === 'id')[0];
    if(attr && attr.value === selector.replace('#', ''))
      return true
  }else if(selector.charAt(0) === '.'){
    let attr = el.attributes.filter(attr => attr.name === 'class')[0];
    if(attr && attr.value === selector.replace('.',''))
      return true
  }else{
    if(el.tagName === selector){
      return true;
    }
  }
  return false;
}
/**计算css样式优先级 */
function specificity(selector){
  let p = [0,0,0,0];
  let selectorParts = selector.split(' ');
  for(let parts of selectorParts){
    if(parts.charAt(0) === '#'){
      p[1] += 1;
    }else if(parts.charAt(0) === '.'){
      p[2] += 1;
    }else{
      p[3] += 1;
    }
  }
}

/** 比较css优先级 */
function compare(sp1,sp2){
  if(sp1[1] - sp2[1]){
    return sp1[1] - sp2[1];
  }else if(sp1[2] - sp2[2]){
    return sp1[2] - sp2[2];
  }else if(sp1[0] - sp2[0]){
    return sp1[0] - sp2[0];
  }
  return sp1[3] - sp2[3];
}

function computeCSS(el){
    /** 复制stack元素，并按照由内向外的顺序排列 */
    let elements = stack.slice().reverse();
    /** 初始化computedStyle */
    if(!el.computedStyle){
        el.computedStyle = {};
    }
    /** 循环当前css Rules */
    for(let rule of rules){
        let selectorParts = rule.selectors[0].split(" ").reverse();
        if(!match(el,selectorParts[0])){
            continue;
        };
        let matched = false;

        let j = 1;
        for(let i = 0; i < elements.length; i++){
          if(match(elements[i], selectorParts[j])){
            j++;
          }
        }
        
        if(j >= selectorParts.length){  // css 匹配完成
          matched = true;
        }
        
        if(matched){
          let sp;
          if(rule.selector&&rule.selector[0]){
            sp = specificity(rule.selector[0]);
          }
          let computedStyle = el.computedStyle;
          for(let declaration of rule.declarations){
            if(!computedStyle[declaration.property]){
              computedStyle[declaration.property] = {};
            }

            if(!computedStyle[declaration.property].specificity){
              computedStyle[declaration.property].value = declaration.value;
              computedStyle[declaration.property].specificity = sp;
            }else if(compare(computedStyle[declaration.property].specificity,sp)<0){
              computedStyle[declaration.property].value = declaration.value;
              computedStyle[declaration.property].specificity = sp;
            }
          }
        }
    }
}


function emit(token){     
    console.log(token);
    let top = stack[stack.length -1];
    if(token.type === 'startTag'){
        let element = {
            type: 'element',
            children: [],
            attributes: [],
        }
        element.tagName = token.tagName;
        
        for(let el in token){
            if(el !== 'type' && el !== 'tagName'){
                element.attributes.push({
                    name: el,
                    value: token[el]
                })
            }
        }

        /** 获取startTag，和css rules进行对比 */
        computeCSS(element);

        // 对偶
        top.children.push(element);
        element.parent = top;

        if(!token.isSelfClosing){
            stack.push(element);
        }     
        currentTextNode = null;
    }else if(token.type === 'endTag'){
        if(top.tagName != token.tagName){
            throw new Error('the start end doesn\'t match');
        }else{
            /** 遇到css标签时，执行添加css规则操作  当前代码只是收集 style标签内的css样式 */
            if(token.tagName === 'style'){
                addCSSRules(top.children[0].content);
            }
            layout(top);
            stack.pop();
        }
        currentTextNode = null ;
    }else if(token.type === 'text'){
        if(currentTextNode == null){
            currentTextNode = {
                type: 'text',
                content: ""
            }
            top.children.push(currentTextNode);
        }
        currentTextNode.content += token.content;
    }
}


const EOF = Symbol('EOF')

function data(c){
    if(c === '<'){
        return tagOpen;
    }else if(c === EOF){
        emit({
            type: 'EOF'
        });
        return ;
    }else{
        emit({
            type: 'text',
            content: c
        })
        return data;
    }
}

function tagOpen(c) {
    if(c === '/'){   // </html> 结束标签
        return endTagOpen;
    }else if(c.match(/^[a-zA-Z]$/)){
        currentToken = {
            type: 'startTag',
            tagName: ''
        }
        return tagName(c);
    }else{
        return;
    }
}

function endTagOpen(c) {
    if(c.match(/^[a-zA-Z]$/)){
        currentToken = {
            type: 'endTag',
            tagName: ''
        }
        return tagName(c);
    }else if(c === '>'){
        console.log('error in >');
    }else if(c === EOF) {
        console.log('error in EOF');
    }else{

    }
}

function tagName(c) {
    if(c.match(/^[\t\n\f ]$/)){   // 此时获取标签属性名
        return beforeAttributeName;
    }else if(c === '/'){
        return selfClosingStartTag; // <img />
    }else if(c === '>'){
        emit(currentToken);  // 如果一个标签结束就emit当前token
        return data;
    }else if(c.match(/^[a-zA-Z]$/)){
        currentToken.tagName += c; // 如果是字母的话追加到当前token的tagName中
        return tagName;
    }else{
        return tagName;
    }
}

// 处理属性函数  
function beforeAttributeName(c){
    if(c.match(/^[\t\n\f ]$/)){  // 开始处理属性参数
        return beforeAttributeName; 
    }else if(c === '>' || c === '/' || c === EOF){
        return afterAttributeName(c);
    }else if(c === '='){
        
    }else {
        currentAttribute = {
            name: '',
            value: '', 
        }
        return attributeName(c);
    }
}

// 属性名称函数
function attributeName(c) {
    if(c.match(/^[\t\n\f ]$/) || c === '/' || c === '>' || c === EOF){
        return afterAttributeName(c);
    }else if(c === '='){
        return beforeAttributeValue;
    }else if(c === '\u0000'){

    }else if(c === "\"" || c === "'" || c === "<"){

    }else {
        currentAttribute.name += c; 
        return attributeName;
    }
}
//
function afterAttributeName(c) {
    if(c.match(/^[\t\n\f ]$/)){
        return afterAttributeName;
    }else if(c === '/'){
        return selfClosingStartTag;
    }else if(c === '='){
        return beforeAttributeValue;
    }else if(c === '>'){
        currentToken[currentAttribute.name] = currentAttribute.value;
        emit(currentToken);
        return data;
    }else if(c === EOF){

    }else{
        currentToken[currentAttribute.name] = currentAttribute.value;
        currentAttribute = {
            name: "",
            value: ""
        }
        return attributeName(c);
    }
}

function beforeAttributeValue(c){
    if(c.match(/^[\t\n\f ]$/) || c === '/' || c === '>' || c === EOF){
        return beforeAttributeValue;
    }else if(c === '\"'){
        return doubleQuotedAttributeValue;  // 双引号处理
    }else if(c === '\''){
        return singleQuotedAttributeValue;  // 单引号处理
    }else if(c === '>'){

    }else { 
        return UnQuotedAttributeValue;
    }
}
// 双引号value值处理
function doubleQuotedAttributeValue(c) {
    if(c === '\"'){
        currentToken[currentAttribute.name] = currentAttribute.value;
        return afterQuotedAttributeValue;
    }else if(c === '\u0000'){

    }else if(c === EOF){

    }else {
        currentAttribute.value += c;
        return doubleQuotedAttributeValue;
    }
}

// 单引号value值处理
function singleQuotedAttributeValue(c) {
    if(c === '\''){
        currentToken[currentAttribute.name] = currentAttribute.value;
        return afterQuotedAttributeValue;
    }else if(c === '\u0000'){

    }else if(c === EOF){

    }else {
        currentAttribute.value += c;
        return singleQuotedAttributeValue;  // 这是个坑吗 ？
    }
}
// 无引号value值处理
function UnQuotedAttributeValue(c) {
    if(c.match(/^[\t\n\f ]$/) ){
        currentToken[currentAttribute.name] = currentAttribute.value;
        return beforeAttributeName;
    }else if(c === '/'){
        currentToken[currentAttribute.name] = currentAttribute.value;
        return selfClosingStartTag;
    }else if(c === '>'){
        currentToken[currentAttribute.name] = currentAttribute.value;
        emit(currentToken);
        return data;
    }else if(c === '\u0000'){

    }else if(c === EOF){

    }else if(c === '\'' || c === '\"' || c === '<' || c === '='){

    }else {
        currentAttribute.value += c;
        return UnQuotedAttributeValue;
    }
}

function afterQuotedAttributeValue(c){
    if(c.match(/^[\t\n\f ]$/)){
        return beforeAttributeName;
    }else if(c === '/'){
        return selfClosingStartTag;
    }else if(c === '>'){
        currentToken[currentAttribute.name] = currentAttribute.value;
        emit(currentToken);
        return data;
    }else if(c === EOF){

    }else{
        currentAttribute.value += c;
        return doubleQuotedAttributeValue;

    }
}

function selfClosingStartTag(c){
    if(c === '>'){
        currentToken.isSelfClosing = true;
        emit(currentToken);
        return data;
    }else{
        console.log('selfClosingStartTag error');
    }
}

module.exports.parserHtml  = function parserHtml(html) {
    console.log(parserHtml);
    let state = data;
    // 状态机
    for(let c of html){
        state = state(c);
    }
    state = state(EOF);
    console.log(stack[0])
    return stack[0];
}