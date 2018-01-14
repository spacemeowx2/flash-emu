
program 
  statementlist 
    config namespace  
      identifier CONFIG 
    import  
      packagename 
        packageidentifiers 
          identifier __AS3__
          identifier vec
          identifier Vector
    function 
      functionname 
        qualifiedidentifier main
      functioncommon 
        functionsignature 
        statementlist 
          var  
            list 
              variablebinding 
                typedidentifier 
                  qualifiedidentifier a
              variablebinding 
                typedidentifier 
                  qualifiedidentifier b
              variablebinding 
                typedidentifier 
                  qualifiedidentifier c
          var  
            list 
              variablebinding 
                typedidentifier 
                  qualifiedidentifier i
                literalnumber:100
          for  
            list 
              binary lessthan 
                member 
                  get lexical 
                    identifier i
                literalnumber:1000 
            list 
              member 
                increment lexical postfix plusplus  
                  identifier i 
            statementlist 
              expression 
                list 
                  member 
                    set lexical 
                      identifier a
                      argumentlist 
                        binary modulus 
                          member 
                            get lexical 
                              identifier i
                          literalnumber:10
              expression 
                list 
                  member 
                    set lexical 
                      identifier b
                      argumentlist 
                        unary not 
                          unary not 
                            list 
                              binary modulus 
                                list 
                                  binary div 
                                    member 
                                      get lexical 
                                        identifier i
                                    literalnumber:10
                                literalnumber:10
              expression 
                list 
                  member 
                    set lexical 
                      identifier c
                      argumentlist 
                        unary not 
                          unary not 
                            list 
                              list 
                                binary div 
                                  member 
                                    get lexical 
                                      identifier i
                                  literalnumber:100
              if 
                list 
                  binary strictequals 
                    member 
                      get lexical 
                        identifier i
                    binary plus 
                      binary plus 
                        binary mult 
                          binary mult 
                            member 
                              get lexical 
                                identifier a
                            member 
                              get lexical 
                                identifier a
                          member 
                            get lexical 
                              identifier a
                        binary mult 
                          binary mult 
                            member 
                              get lexical 
                                identifier b
                            member 
                              get lexical 
                                identifier b
                          member 
                            get lexical 
                              identifier b
                      binary mult 
                        binary mult 
                          member 
                            get lexical 
                              identifier c
                          member 
                            get lexical 
                              identifier c
                        member 
                          get lexical 
                            identifier c 
                statementlist 
                  expression 
                    list 
                      member 
                        call lexical 
                          identifier trace
                          argumentlist 
                            member 
                              get lexical 
                                identifier i 
          expression 
            list 
              member 
                call lexical 
                  identifier trace
                  argumentlist 
                    literalstring:done
          return 
