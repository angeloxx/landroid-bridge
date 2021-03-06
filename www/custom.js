(function() {
    "use strict";

    function setupTabs() {
        $("#nav-item-schedule > a").click(function() {
            $(".nav-link").removeClass("active");
            $("#nav-item-schedule > a").addClass("active");
            $(".container-x").hide();
            $("#container-schedule").show();
            return false;
        });
        $("#nav-item-readings > a").click(function() {
            $(".nav-link").removeClass("active");
            $("#nav-item-readings > a").addClass("active");
            $(".container-x").hide();
            $("#container-readings").show();
            return false;
        });
        $("#nav-item-about > a").click(function() {
            $(".nav-link").removeClass("active");
            $("#nav-item-about > a").addClass("active");
            $(".container-x").hide();
            $("#container-about").show();
            return false;
        });
    }

    function createScheduleRows() {
        for (var i=0; i<=7; i++) {
            var date = moment().add(i, "days");
            var dateFormatted = date.format("YYYY-MM-DD");
            var label = dateFormatted;
            var row = $(document.createElement("tr"));
            var col = $(document.createElement("th"));
            if (date.isSame(moment(), "day")) {
                label = "Today";
            } else if (date.isSame(moment().add(1, "days"), "day")) {
                label = "Tomorrow";
            } 
            col.attr("scope", "row");
            col.html(label + '<div class="cut-edge" style="color:orange;display:none">Cut Edge</div>');
            col.attr("style", "white-space:nowrap");
            row.append(col);
            row.attr("id", "scheduler-row-" + dateFormatted);
            for (var j=0; j<=23; j++) {
                col = $(document.createElement("td"));
                col.attr("id", "scheduler-cell-" + dateFormatted + "-" + j);
                row.append(col);
            }
            $("#container-schedule table > tbody").append(row);
        }
    }

    function loadIntelliSchedule() {
        let now = moment();
        $.get("./scheduler/next7day", function(data) {
            Object.keys(data).forEach(date => {
                var item = data[date];
                var startHour = item.startHour;
                var lastHour = startHour + Math.floor(item.durationMinutes / 60) - 1;
                for (var j=startHour; j<=lastHour; j++) {
                    var targetCell = $("#scheduler-cell-" + date + "-" + j);
                    targetCell.css("background-color", "orange");
                }
                if (item.cutEdge) {
                    $("#scheduler-row-" + date + " .cut-edge").show();
                }
            });
        });
    }

    function loadWeather(config, cb) {
        $.get("./weather/hourly10day", function(data) {
            data.forEach(element => {
                var targetCell = $("#scheduler-cell-" + moment(element.dateTime).format("YYYY-MM-DD-H"));
                if (element.precipitation >= config.threshold) {
                    targetCell.css("background-color", "#87CEFA");
                }
                var precipitation = $(document.createElement("div"));
                precipitation.text(element.precipitation + "%");
                var temp = $(document.createElement("div"));
                temp.text(element.temperature + "°");
                targetCell.append(precipitation);
                targetCell.append(temp);
            });
            cb();
        });
    }

    function loadSchedule() {
        createScheduleRows();
        $.get("./scheduler/config", function(config) {
            if (config.enable) {
                for (var j=0; j<=config.earliestStart-1; j++) {
                    var col = $("#container-schedule thead th:nth-child("+(j+2)+")");
                    col.css("color", "#D3D3D3");
                }
                for (var j=config.latestStop; j<=23; j++) {
                    var col = $("#container-schedule thead th:nth-child("+(j+2)+")");
                    col.css("color", "#D3D3D3");
                }
                loadWeather(config, function() {
                    loadIntelliSchedule(config);
                });
                if (config.cron) {
                    $("#hint-cron-true").show();
                } else {
                    $("#hint-cron-false").show();
                }
            } else {
                $("#container-schedule .table-responsive").hide();
                $("#scheduler-disabled").show();
            }
        });
    }

    function loadReadings() {
        var container = $('#container-readings');
        var weekdays = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday"
        ];
        $.get("./landroid-s/status", function(status) {
            container.empty();
            Object.keys(status).forEach(key => {
                var item = $(document.createElement("p"));
                container.append(item);
                if (key === "schedule") {
                    item.text(key + " = ");
                    status[key].forEach((scheduleItem, i) => {
                        var subItem = $(document.createElement("p"));
                        subItem.text(weekdays[i] + " = " + JSON.stringify(scheduleItem));
                        subItem.css("padding-left", "20px");
                        container.append(subItem);
                    });
                } else {
                    item.text(key + " = " + status[key]);
                }
            });
        }).fail(function() {
            container.html("<p>Could not load status.</p>");
        });
    }

    setupTabs();
    loadSchedule();
    loadReadings();
}());