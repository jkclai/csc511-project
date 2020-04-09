function parseQuery(query) {
    let infix = tokenizer(query);
    let postfix = parser(infix);
    let indices = calculator(postfix);
    let result = retriever(indices);
    
    clearAll();
    visualizeTimeLine(result);
}

function tokenizer(str) {
    function isOperand(ch) {
        return /\d|\w|\:/.test(ch);
    }
    function isOperatorSingle(ch) {
        return /\!/.test(ch);
    }
    function isOperatorDouble(ch) {
        return /\&|\|/.test(ch);
    }
    function isParenthesisLeft(ch) {
        return (ch === "(");
    }
    function isParenthesisRight(ch) {
        return (ch === ")");
    }

    let result = [];
    let buffer = "";
    let lastType = "";
    let currType = "";

    let strArray = str.replace(/\s+/g, "").split("");
    for(let ch of strArray) {
        if(isOperand(ch)) {
            currType = "operand";
        }
        else if(isOperatorSingle(ch)) {
            currType = "operatorSingle";
        }
        else if(isOperatorDouble(ch)) {
            currType = "operatorDouble";
        }
        else if(isParenthesisLeft(ch)) {
            currType = "parenthesisLeft";
        }
        else if(isParenthesisRight(ch)) {
            currType = "parenthesisRight";
        }

        if(currType.includes("parenthesis")) {
            if(lastType != "") {
                result.push({
                    name: buffer,
                    type: lastType
                });
            }

            result.push({
                name: ch,
                type: currType
            });

            buffer = "";
            lastType = "";
            continue;
        }

        if(currType == lastType || lastType == "") {
            buffer += ch;
            lastType = currType;
        }
        else if(currType != lastType){
            result.push({
                name: buffer,
                type: lastType
            });

            buffer = ch;
            lastType = currType;
        }
    };

    if(lastType != "") {
        result.push({
            name: buffer,
            type: lastType
        });
    }

    return result;
}

function parser(tokens) {
    let associativity = {
        "!": "right",
        "&&" : "left",
        "||" : "left"
    };
    let precedence = {
        "!": "3",
        "&&": "2",
        "||": "1"
    };

    let result = [];
    let opStack = [];

    for(let token of tokens) {
        if(token["type"] == "operand") {
            result.push(token);
            continue;
        }
        else if(token["type"].includes("operator")) {
            while(opStack.length > 0) {
                let op = opStack.slice(-1)[0];
                if((associativity[token["name"]] == "left" && precedence[token["name"]] <= precedence[op["name"]]) || (associativity[token["name"]] == "right" && precedence[token["name"]] < precedence[op["name"]])) {
                    result.push(opStack.pop());
                }
                else {
                    break;
                }
            }
            opStack.push(token);
        }
        else if(token["type"] == "parenthesisLeft") {
            opStack.push(token);
        }
        else if(token["type"] == "parenthesisRight") {
            while(opStack.slice(-1)[0]["type"] != "parenthesisLeft") {
                result.push(opStack.pop());
            }
            opStack.pop();
        }
    }

    while(opStack.length != 0) {
        result.push(opStack.pop());
    }

    return result;
}

function calculator(tokens) {
    function read(token) {
        let target = token["name"].split(":");

        return window.data.map(function(d) {
            if(d[target[0]].toLowerCase().includes(target[1].toLowerCase())) {
                return true;
            }
            return false;
        });
    }

    function calculateSingle(operand, operator) {
        if(operator["name"] == "!") {
            return operand.map(function(d) {
                return !d;
            });
        }
    }

    function calculateDouble(operandA, operandB, operator) {
        if(operator["name"] == "&&") {
            return operandA.map(function(d, i) {
                return d && operandB[i];
            });
        }
        else if(operator["name"] == "||") {
            return operandA.map(function(d, i) {
                return d || operandB[i];
            });
        }
    }

    let result = [];

    for(let token of tokens) {
        if(token["type"] == "operand") {
            result.push(read(token));
        }
        else if(token["type"] == "operatorSingle") {
            let operand = result.pop();
            result.push(calculateSingle(operand, token));
        }
        else if(token["type"] == "operatorDouble") {
            let operandB = result.pop();
            let operandA = result.pop();
            result.push(calculateDouble(operandA, operandB, token));
        }
    }
    
    return result[0];
}

function retriever(indices) {
    let matches = window.data.filter((d, i) => indices[i]);

    let gameidList = matches.map(d => d["gameid"]);

    return window.data.filter(function(d) {
        return gameidList.includes(d["gameid"]);
    });
}