<script>
  import Fa from "svelte-fa";
  import { faSyncAlt } from '@fortawesome/free-solid-svg-icons';

  import HeaderLine from "$lib/components/HeaderLine.svelte";
  import Row from "$lib/components/layout/Row.svelte";
  import Box from "$lib/components/layout/Box.svelte";
  import BoxItem from "$lib/components/layout/BoxItem.svelte";

  import {
    currentUser,
    ecosystems,
    ecosystemsCurrentSensorsData, ecosystemsIds,
    ecosystemsLight,
    ecosystemsManagement,
    serverCurrentData,
    serverLastSeen,
    serverLatency,
    services,
    warnings,
    weatherCurrently,
  } from "$lib/store.js";
  import { permissions } from "$lib/utils/consts.js";
  import {
    computeEcosystemStatusClass,
    computeLightingHours,
    computeLightStatusClass,
    computeCurrentSensorsAverages,
    computeUptime,
    isEmpty,
    formatDate,
    formatDateTime,
    getWeatherIcon,
    serviceEnabled
  } from "$lib/utils/functions.js";

  export let data;
  const {
    ecosystemsCurrentSensorsDataValues, ecosystemsLightValues,
    serverCurrentDataValues, serverStartTimeValue, weatherCurrentlyValues,
  } = data;
  ecosystemsCurrentSensorsData.set(ecosystemsCurrentSensorsDataValues);
  ecosystemsLight.set(ecosystemsLightValues);
  serverCurrentData.set(serverCurrentDataValues);
  weatherCurrently.set(weatherCurrentlyValues)

  let now = new Date();
  const serverStartTime = new Date(serverStartTimeValue);
  let filledBox = {};

  $: weatherEnabled = serviceEnabled($services, "weather");
  $: calendarEnabled = serviceEnabled($services, "calendar");
  $: uptime = computeUptime($serverLastSeen, serverStartTime)
</script>

<HeaderLine title={"Home"}/>

<h2>Global overview</h2>
<Row>
  <Box title="Calendar" align="center">
    <BoxItem title={formatDate(now)}>
      {#if calendarEnabled}
        <p>Later here: your personal calendar</p>
      {/if}
    </BoxItem>
  </Box>
  {#if weatherEnabled && !isEmpty($weatherCurrently)}
    <Box title="Current weather" align="center">
      <i class="{ getWeatherIcon($weatherCurrently.icon) } weather-icon"></i>
      <BoxItem title="{ $weatherCurrently.summary }">
        <p>Temperature: { $weatherCurrently.temperature.toFixed(1) } °C</p>
        <p>Wind: { $weatherCurrently.windSpeed.toFixed(1) } km/h</p>
        <p>Precipitation:{ ($weatherCurrently.precipProbability * 100).toFixed(1) } %</p>
        <p>Humidity: { ($weatherCurrently.humidity * 100).toFixed(1) } %</p>
        <p>Cloud cover:{ ($weatherCurrently.cloudCover * 100).toFixed(1) } %</p>
      </BoxItem>
    </Box>
  {/if}
  {#if $currentUser.can(permissions.ADMIN) && !isEmpty($serverCurrentData)}
    <Box title="Server info" align="center">
      <BoxItem title="Uptime">
        { uptime }
      </BoxItem>
      <BoxItem title="Average latency">
        <p>{ $serverLatency } ms</p>
      </BoxItem>
      <BoxItem title="System usage">
        <p>Average CPU load: { $serverCurrentData.CPU_used } %</p>
        {#if $serverCurrentData.CPU_temp}
          <p>CPU temperature: { $serverCurrentData.CPU_temp } °C</p>
        {/if}
        <p>RAM used:
          { $serverCurrentData.RAM_used } GB / { $serverCurrentData.RAM_total } GB
        </p>
        <p>Disk used:
          { $serverCurrentData.DISK_used } GB / { $serverCurrentData.DISK_total } GB
        </p>
      </BoxItem>
    </Box>
  {/if}
  {#if $currentUser.isAuthenticated}
    <Box title="Warnings overview" align="center">
      <BoxItem>
        {#each $warnings as warning}
          { warning.content }
        {:else}
          No warning
        {/each}
      </BoxItem>
    </Box>
  {/if}
</Row>

{#if $ecosystemsIds.length > 0}
  <h2>Ecosystems overview</h2>
  {#each $ecosystemsIds as id}
    <Box
      title="{id.name}"
      align="center"
      status="{computeEcosystemStatusClass($ecosystems[id.uid])}"
      direction="row"
    >
      <template>{filledBox[id.uid] = false}</template>
      {#if
        $ecosystems[id.uid] && $ecosystems[id.uid]['connected'] &&
        $ecosystemsManagement[id.uid] && $ecosystemsManagement[id.uid]['light'] &&
        $ecosystemsLight[id.uid]
      }
        <template>{filledBox[id.uid] = true}</template>
        <BoxItem title="Light">
          <p>
            Status:
            <Fa
              icon={ faSyncAlt }
              class="{computeLightStatusClass($ecosystemsLight[id.uid])}"
              spin="{$ecosystemsLight[id.uid]['mode'] === 'automatic'}"
            />
          </p>
          <p>{computeLightingHours($ecosystemsLight[id.uid])}</p>
        </BoxItem>
      {/if}
      {#if
        $ecosystems[id.uid] && $ecosystems[id.uid]['connected'] &&
        $ecosystemsManagement[id.uid] && $ecosystemsManagement[id.uid]['environment_data']
      }
        <template>{filledBox[id.uid] = true}</template>
        <BoxItem title="Environment">
          {#if $ecosystemsCurrentSensorsData[id.uid]}
            { @html computeCurrentSensorsAverages(
                $ecosystemsCurrentSensorsData[id.uid],
                'environment'
              ) }
          {:else}
            <p>Collecting environment's data from the ecosystem</p>
          {/if}
        </BoxItem>
      {/if}
      {#if
        $ecosystems[id.uid] && $ecosystems[id.uid]['connected'] &&
        $ecosystemsManagement[id.uid] && $ecosystemsManagement[id.uid]['plants_data']
      }
        <template>{filledBox[id.uid] = true}</template>
        <BoxItem title="Plants">
          {#if $ecosystemsCurrentSensorsData[id.uid]}
            { @html computeCurrentSensorsAverages(
                $ecosystemsCurrentSensorsData[id.uid],
                'plants'
              ) }
          {:else}
            <p>Collecting plants data from the ecosystem</p>
          {/if}
        </BoxItem>
      {/if}
      {#if
        $ecosystems[id.uid] && $ecosystems[id.uid]['connected']
        && !$ecosystems[id.uid]["status"]
      }
        <template>{filledBox[id.uid] = true}</template>
        <BoxItem>
          <p>The ecosystem { id.name } is not currently running</p>
          {#if $currentUser.can(permissions.OPERATE)}
            <p>
              Click
              <a href="/settings/ecosystem/{id.name}">here</a>
              to configure { id.name }
            </p>
         {/if}
        </BoxItem>
      {/if}
      {#if $ecosystems[id.uid] && !$ecosystems[id.uid]["connected"]}
        <template>{filledBox[id.uid] = true}</template>
        <BoxItem>
          <p>The ecosystem { id.name } is not currently connected</p>
          <p>
            Last connection to the server on
            { formatDateTime(new Date($ecosystems[id.uid]["last_seen"])) }
          </p>
        </BoxItem>
      {/if}
      {#if $ecosystems[id.uid] && !filledBox[id.uid]}
        <BoxItem>
          <p>No functionality is enabled in { id.name }</p>
          {#if $currentUser.can(permissions.OPERATE)}
            <p>
              Click
              <a href="/settings/ecosystem/{id.name}">here</a>
              to configure { id.name }
            </p>
          {/if}
        </BoxItem>
      {/if}
    </Box>
  {/each}
{/if}

<style>
  .weather-icon {
    height: 115px;
    line-height: 115px;
    font-size: 70px;
    background: inherit;
    margin-bottom: -1px;
  }
</style>