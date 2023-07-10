import "./index.css";
import * as echarts from "echarts";
import ReactEcharts from "echarts-for-react";
import { addMinutes, format } from "date-fns";
import React, { useEffect, useState } from "react";
import { colorMap, INTERVAL } from "../../../data/constants";

const PowerSourceChart = () => {
  const [data, setData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [dates, setDates] = useState([]);
  const [option, setOption] = useState({});
  const [loading, setLoading] = useState(true);

  const generateTimeSeries = (date) => {
    const timeSeries = [];

    const startTime = new Date(date); // current date and time
    startTime.setHours(0, 0, 0, 0); // set time to midnight
    const endTime = addMinutes(
      startTime,
      new Date(date).toDateString() === new Date().toDateString()
        ? new Date().getHours() * 60
        : 24 * 60
    ); // add 24 hours

    // Generate the time series
    let currentTime = startTime;

    while (currentTime < endTime) {
      timeSeries.push(format(currentTime, "yyyy-MM-dd HH:mm"));
      currentTime = addMinutes(currentTime, 5);
    }

    return timeSeries;
  };

  const fetchData = async () => {
    try {
      const response = await fetch(
        "https://api.thunder.softoo.co/vis/api/dashboard/ssu/fixed"
      );
      const responseJson = await response.json();

      setData(responseJson.data);
    } catch (e) {
      console.log(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (dates.length > 0) {
      const tempChartData = [];
      dates.forEach((date, index) => {
        const newTimeSeries = generateTimeSeries(date);

        newTimeSeries.forEach((time) => {
          const status = data?.find(
            (d) => Date.parse(d.minute_window) === Date.parse(time)
          );

          let duration = Date.parse(time);
          const typeItem = colorMap.find(
            (item) => item.name === status?.sourceTag
          );
          const item = {
            name: typeItem?.name || "Empty time slot",
            value: [
              index,
              duration,
              Date.parse(addMinutes(duration, INTERVAL)),
              INTERVAL,
            ],
            itemStyle: {
              normal: {
                color: typeItem?.color || "white",
              },
            },
          };
          tempChartData.push(item);
          duration = Date.parse(addMinutes(duration, INTERVAL));
        });
      });
      setChartData(tempChartData);
      updateChartOption();
    }
  }, [dates]);

  useEffect(() => {
    if (data?.length > 0) {
      const uniqueDates = [...new Set(data.map((obj) => obj.date))];
      setDates(uniqueDates);
    }
  }, [data]);

  const renderItem = (params, api) => {
    var categoryIndex = api.value(0);
    var start = api.coord([api.value(1), categoryIndex]);
    var end = api.coord([api.value(2), categoryIndex]);
    var height = api.size([0, 1])[1] * 0.6;
    var rectShape = echarts.graphic.clipRectByRect(
      {
        x: start[0],
        y: start[1] - height / 2,
        width: end[0] - start[0],
        height: height,
      },
      {
        x: params.coordSys.x,
        y: params.coordSys.y,
        width: params.coordSys.width,
        height: params.coordSys.height,
      }
    );
    return (
      rectShape && {
        type: "rect",
        transition: ["shape"],
        shape: rectShape,
        style: api.style(),
      }
    );
  };

  const updateChartOption = () => {
    const tempOption = {
      tooltip: {
        formatter: function (params) {
          return `${params.marker}${params.name}: ${format(
            new Date(params.value[1]),
            "yyyy-MM-dd HH:mm:ss"
          )}`;
        },
      },
      title: {
        text: "Power Source Graph",
        left: "center",
      },
      dataZoom: [
        {
          type: "slider",
          filterMode: "weakFilter",
          showDataShadow: false,
          top: 400,
          labelFormatter: "",
        },
        {
          type: "inside",
          filterMode: "weakFilter",
        },
      ],
      grid: {
        height: 300,
      },
      xAxis: {
        type: "time",
        scale: true,
        axisLabel: {
          formatter: (val) => {
            return format(new Date(val), "HH:mm");
          },
        },
      },
      yAxis: {
        data: dates,
      },
      series: [
        {
          type: "custom",
          renderItem,
          encode: {
            x: [1, 2],
            y: 0,
          },
          data: chartData,
        },
      ],
    };
    setOption(tempOption);
  };

  return (
    <ReactEcharts
      theme='dark'
      option={option}
      lazyUpdate={true}
      showLoading={loading}
      style={{ height: "700px" }}
    />
  );
};

export default PowerSourceChart;
