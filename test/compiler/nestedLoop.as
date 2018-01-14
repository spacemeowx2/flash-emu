function main(){
	var a = 0
	for (var i = 0; i < 10; i++) {
	  a += i
	  for (var j = 0; j < 10; j++) {
		a += j
	  }
	  a--
	}
	trace(a)
}