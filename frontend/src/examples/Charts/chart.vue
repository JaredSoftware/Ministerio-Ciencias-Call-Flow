<template>
  <div>
    <ChartComponent :jsonData="jsonData" />
  </div>
</template>

<script>
import ChartComponent from './ChartComponent.vue';

export default {
  name: 'App',
  components: {
    ChartComponent
  },
  data() {
    return {
      jsonData: [
        // ... (tu JSON de datos)
      ]
    };
  }
};
</script>

<style>
/* Puedes agregar estilos aquí si es necesario */
</style>
