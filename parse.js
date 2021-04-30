const EOF = Symbol('EOF')

function data(c){

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