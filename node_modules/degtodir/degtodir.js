function convert(deg) {
    // check for invalid input
    if (deg < 0) {
        return "Error: degrees < 0";
    }
    if (deg > 360) {
        return "Error: degrees > 360";
    }
    // everything is okay check degrees and return
    if (deg >= 22.5 && deg <= 67.5) {
        return "NE";
    } else if (deg >= 67.5 && deg <= 112.5) {
        return "E";
    } else if (deg >= 112.5 && deg <= 157.5) {
        return "SE";
    } else if (deg >= 157.5 && deg <= 202.5) {
        return "S";
    } else if (deg >= 202.5 && deg <= 247.5) {
        return "SW";
    } else if (deg >= 247.5 && deg <= 292.5) {
        return "W";
    } else if (deg >= 292.5 && deg <= 337.5) {
        return "NW";
    } else {
        return "N";
    }
}

exports.degToDir = convert;