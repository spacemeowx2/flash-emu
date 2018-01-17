function main(p1){
	var a = 1, b = 1
	trace(1)
	trace(1)
	for (var i = 0; i < p1 - 2; i++) {
		var t = a + b
		trace(t)
		a = b
		b = t
	}
}
