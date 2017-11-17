function main(){
    var a, b, c;
    for (var i = 100; i < 1000; i++) {
        a = i % 10;
        b = !!((i / 10) % 10)
        c = !!((i / 100))
        if (i === a*a*a + b*b*b + c*c*c) {
            trace(i);
        }
    }
    trace('done');
}