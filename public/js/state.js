function stateChange(device) {
    if (device.checked) {
        $.get("/devices/state/?id=" + device.id + "&state=1", function (data, status) {
            console.log(status)
        });
    } else if (!(device.checked)) {
        $.get("/devices/state/?id=" + device.id + "&state=0", function (data, status) {
            console.log(status)
        });

    }
}