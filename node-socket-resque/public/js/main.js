$(function() {

    $.fn.serializeObject = function() {
        var o = {};
        var a = this.serializeArray();
        $.each(a, function() {
            if (o[this.name] !== undefined) {
                if (!o[this.name].push) {
                    o[this.name] = [o[this.name]];
                }
                o[this.name].push(this.value || '');
            } else {
                o[this.name] = this.value || '';
            }
        });
        return o;
    };

    var socket,
        workerJobsPie, totalTasksAcrossQueuesBar, totalTasksAcrossQueuesPie, workerJobsHistogram;

    $('#btn_connect').on('click', function(e) {
        e.preventDefault();
        var $that = $(this),
            json = $('#conn_form').serializeObject();
        socket = io();
        _initSockets();
        $(this).attr('disabled', true);
        $('.alert-danger').html('').hide();
        $.ajax({
            url: '/api/connect',
            type: 'POST',
            data: json,
            success: function(data) {
                console.log(data);
                $that.removeAttr('disabled');
                $('.alert-success, .main-graphs-area').show();
            },
            error: function(err) {
                console.log(err);
                $that.removeAttr('disabled');
                $('.alert-danger').html(err.responseText).show();
            }
        })
    });

    $('#btn_reset').on('click', function() {
        $.ajax({
            url: '/api/reset',
            type: 'POST',
            success: function() {
                socket.close();
                location.reload();
            }
        });
    });

    var _buildPieChart = function(config) {
        Highcharts.chart(config.container, {
            chart: {
                plotBackgroundColor: null,
                plotBorderWidth: null,
                plotShadow: false,
                type: 'pie'
            },
            title: {
                text: config.title
            },
            tooltip: {
                formatter: function() {
                    return 'Jobs: <b>' + this.y + '</b>'
                }
            },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                        // format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                        style: {
                            color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                        }
                    }
                }
            },
            series: [{
                // name: 'Brands',
                name: config.seriesName,
                colorByPoint: true,
                data: config.data
                // data: [{
                //     name: 'Microsoft Internet Explorer',
                //     y: 56.33
                // }, {
                //     name: 'Chrome',
                //     y: 24.03,
                //     sliced: true,
                //     selected: true
                // }, {
                //     name: 'Firefox',
                //     y: 10.38
                // }, {
                //     name: 'Safari',
                //     y: 4.77
                // }, {
                //     name: 'Opera',
                //     y: 0.91
                // }, {
                //     name: 'Proprietary or Undetectable',
                //     y: 0.2
                // }]
            }]
        });
    };

    var _buildColumnChart = function(config) {
        Highcharts.chart(config.container, {
            chart: {
                type: 'column'
            },
            title: {
                text: config.title
            },
            xAxis: {
                categories: config.categories
            },
            yAxis: {
                min: 0,
                minRange : 0.1,
                title: {
                    text: 'Jobs'
                }
            },
            // tooltip: {
            //     headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
            //     pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
            //         '<td style="padding:0"><b>{point.y:.1f} mm</b></td></tr>',
            //     footerFormat: '</table>',
            //     shared: true,
            //     useHTML: true
            // },
            plotOptions: {
                column: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                        // format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                        style: {
                            color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                        }
                    },
                    softThreshold: false
                }
            },
            series: [{
                data: config.data
            }]
        });
    };

    var _initSockets = function() {
        socket.on('qData', function(data) {
            $('.alert-success').hide();
            console.log(data);
            var barData, pieData;
            var barConfig = {
                title: 'Total tasks across all queues',
                container: 'container_bar_total_tasks_across_queues',
                data: [],
                qData: data,
                categories: []
            };
            var pieConfig = {
                title: 'Total tasks across all queues',
                container: 'container_pie_total_tasks_across_queues',
                data: [],
                qData: data,
                categories: []
            };
            _.each(data, function(qData) {
                barConfig.categories.push(qData.q);
                barConfig.data.push({
                    name: qData.q,
                    y: qData.jobs.length
                });
                pieConfig.data.push({
                    name: qData.q,
                    y: qData.jobs.length
                });
            });
            console.log(barConfig, pieConfig);
            _buildPieChart(pieConfig);
            _buildColumnChart(barConfig);
        });

        socket.on('qDataUpdate', function(data) {
            console.log(data);
            var barData = [], barCategories = [],
                pieData = [];
            _.each(data, function(qData) {
                var jobsLength = qData.jobs.length;
                var q = qData.q;
                barCategories.push(q);
                // var temp = [];
                // temp.push(q);
                // temp.push(jobsLength);
                // barData.push(temp);
                barData.push({
                    name: q,
                    y: jobsLength
                });
                pieData.push({
                    name: q,
                    y: jobsLength
                });
            });
            console.log(barData, pieData);
            totalTasksAcrossQueuesBar = $('#container_bar_total_tasks_across_queues').highcharts();
            console.warn(totalTasksAcrossQueuesBar.series);
            totalTasksAcrossQueuesBar.xAxis[0].setCategories(barCategories);
            totalTasksAcrossQueuesBar.series[0].setData(barData);
            totalTasksAcrossQueuesPie = $('#container_pie_total_tasks_across_queues').highcharts();
            totalTasksAcrossQueuesPie.series[0].setData(pieData);
            // totalTasksAcrossQueuesPie.series[0].update({
            //     data: pieData
            // });
        });

        socket.on('qWorkersHashList', function(data) {
            console.log(data);
            var columnConfig = {
                title: 'Worker/Jobs Histogram',
                container: 'container_worker_jobs_histogram',
                data: [],
                qData: data,
                categories: []
            };
            _.each(data, function(workerHash, key) {
                columnConfig.categories.push(key);
                console.log(typeof workerHash);
                // var temp = [];
                if(typeof workerHash === 'object') {
                    columnConfig.data.push({
                        name: key,
                        y: 1
                    });
                } else {
                    columnConfig.data.push({
                        name: key,
                        y: 0
                    });
                }
            });
            _buildColumnChart(columnConfig);
        });

        socket.on('qWorkersHashListUpdate', function(data) {
            console.log(data);
            var columnData = [], y = 0;
            _.each(data, function(workerHash, key) {
                console.log(workerHash, typeof workerHash);
                if(typeof workerHash === 'object') {
                    y = 1;
                } else {
                    y = 0;
                }
                columnData.push({
                    name: key,
                    y: y
                });
            });
            workerJobsHistogram = $('#container_worker_jobs_histogram').highcharts();
            workerJobsHistogram.series[0].setData(columnData);
        });

        socket.on('clusterStats', function(data) {
            console.log(data);
            var pieConfig = {
                title: 'Job Status',
                container: 'container_worker_jobs_pie',
                data: [],
                qData: data,
                categories: []
            };
            _.each(data, function(val, key) {
                console.log(key);
                if(key === 'failed' || key === 'processed') {
                    pieConfig.data.push({
                        name: key,
                        y: parseInt(val)
                    });
                }
            });
            _buildPieChart(pieConfig);
        });

        socket.on('clusterStatsUpdate', function(data) {
            console.log(data);
            var pieData = [];
            _.each(data, function(val, key) {
                if(key === 'failed' || key === 'processed') {
                    pieData.push({
                        name: key,
                        y: parseInt(val)
                    });
                }
            });
            workerJobsPie = $('#container_worker_jobs_pie').highcharts();
            workerJobsPie.series[0].setData(pieData);
        });
    };

});
