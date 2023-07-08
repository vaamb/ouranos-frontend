import { faFire, faLightbulb, faTint } from "@fortawesome/free-solid-svg-icons";


let colors = {
  blue: "#226ba3",
  red: "#f0341f",
  yellow: "#e9c429",
};

export const graphs = {
  environment: {
    colors: {
      temperature: colors.red,
      humidity: colors.blue,
      absolute_humidity: colors.blue,
      dew_point: colors.red,
      light: colors.yellow,
    },
    icons: {
      temperature: faFire,
      humidity: faTint,
      absolute_humidity: faTint,
      dew_point: faFire,
      light: faLightbulb,
    },
    units: {
      temperature: "°C",
      humidity: " %",
      absolute_humidity: " g.m-3",
      dew_point: "°C",
      light: " lux",
    },
    max_values: {
      temperature: 35,
      humidity: 100,
      absolute_humidity: 30,
      dew_point: 25,
      light: 100000,
    },
    order: [
      "temperature",
      "humidity",
      "dew_point",
      "absolute_humidity",
      "light",
    ],
  },
  plants: {
    colors: {
      moisture: colors.blue,
      temperature: colors.red,
    },
    icons: {
      moisture: faTint,
      temperature: faFire,
    },
    units: {
      moisture: " % RWC",
      temperature: "°C",
    },
    max_values: {
      moisture: 100,
      temperature: 35,
    },
    order: ["moisture", "temperature",],
  },
  plants_health: {
    measures: {
      green: "Number of green pixels",
      necrosis: "Necrosis percentage",
      index: "Plants health index",
    },
    colors: {
      green: "#307a41",
      necrosis: "#913639",
      index: "#e9c429",
    },
    icons: {
      green: "fas fa-leaf",
      necrosis: "fas fa-dizzy",
      index: "fas fa-heartbeat",
    },
    list_index: {
      green: 2,
      necrosis: 3,
      index: 1,
    },
    max_values: {
      green: 1000,
      necrosis: 100,
      index: 100,
    },
  },
  server: {
    measures: {
      CPU_used: "CPU load",
      CPU_temp: "CPU temperature",
      RAM_used: "Total RAM usage",
      RAM_process: "Process RAM usage",
      DISK_used: "Disk space used",
    },
    colors: {
      CPU_used: colors.blue,
      CPU_temp: colors.red,
      RAM_used: colors.blue,
      DISK_used: colors.blue,
    },
    icons: {
      CPU_used: "fas fa-microchip",
      CPU_temp: "fas fa-fire",
      RAM_used: "fas fa-memory",
      DISK_used: "fas fa-database",
    },
    units: {
      CPU_used: "%",
      CPU_temp: "°C",
      RAM_used: "GB",
      DISK_used: "GB",
    },
    max_values: {
      CPU_used: 100,
      CPU_temp: 75,
    },
  },
};
