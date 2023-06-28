import { addMinutes, format } from "date-fns";
import * as echarts from "echarts";
import ReactEcharts from "echarts-for-react";
import React, { useEffect, useState } from "react";
import { colorMap, INTERVAL } from "../../../data/constants";
import "./index.css";

const PowerSourceChart = () => {
  const [data, setData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [dates, setDates] = useState([]);
  const [option, setOption] = useState({});

  const fetchData = async () => {
    try {
      const response = await fetch(
        "https://api.thunder.softoo.co/vis/api/dashboard/ssu/fixed"
      );
      let responseJson = await response.json();
      responseJson = responseJson.data;
      setData(responseJson);
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (dates.length > 0) {
      const tempChartData = [];
      dates.forEach((date, index) => {
        const singleDay = data?.filter((d) => d.date === date);
        let baseTime = Date.parse(`${date} 00:00:00`);

        let duration = baseTime;
        for (let i = 0; i < 288; i++) {
          const status = singleDay.find(
            (d) => Date.parse(d.minute_window) === duration
          );
          const typeItem = colorMap.find(
            (item) => item.name === status?.sourceTag
          );
          const item = {
            name: typeItem?.name || "Empty time slot",
            value: [
              index,
              duration,
              Date.parse(addMinutes(duration, INTERVAL)),
            ],
            itemStyle: {
              normal: {
                color: typeItem?.color || "white",
              },
            },
          };
          tempChartData.push(item);
          duration = Date.parse(addMinutes(duration, INTERVAL));
        }
        setChartData(tempChartData);
        updateChartOption();
      });
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
          console.log(params);
          return `${params.marker}${params.name}: ${format(
            new Date(params.value[2]),
            "yyyy-MM-dd HH:MM:ss"
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
          formatter: (val) => new Date(val).toLocaleTimeString(),
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
      lazyUpdate={true}
      option={option}
      style={{ height: "700px" }}
    />
  );
};

export default PowerSourceChart;
