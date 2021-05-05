
let currentToken = null;   // 全局状态

let currentAttribute = null;

function emit(token){     
    console.log(token);
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
    if(c.match(/^[\t\n\f ]$/) || c === '/' || c === '>' || c === '>'){
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

function beforeAttributeValue(c){
    if(c.match(/^[\t\n\f ]$/) || c === '/' || c === '>' || c === '>'){
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
}