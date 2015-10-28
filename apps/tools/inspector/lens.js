const PATH_DELIMITER = '.'

function lens(data, path) {
    var p = path.split(PATH_DELIMITER);
    var segment = p.shift();

    if (!segment) {
        return data;
    }

    var t = type(data);

    if (t === 'Array' && data[integer(segment)]) {
        return lens(data[integer(segment)], p.join(PATH_DELIMITER));
    } else if (t === 'Object' && data[segment]) {
        return lens(data[segment], p.join(PATH_DELIMITER));
    }
}

function integer(string) {
    return parseInt(string, 10);
}