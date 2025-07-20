<template>
  <div>
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import Chart from 'chart.js';
import axios from 'axios';

export default {
  name: 'ChartComponent',
  setup() {
    const chartCanvas = ref(null);
    let chartInstance = null;

    onMounted(async () => {
      try {
        const response = await axios.get('http://localhost:9035/api/postgres/calls');

        const jsonData = response.data;
        const answers = jsonData.map(item => item.answers);
        const labels = answers.map(answer => answer[0].answer_text);
        const values = answers.map(answer => answer[0].respuesta);

        if (chartInstance) {
          chartInstance.destroy();
        }

        const ctx = chartCanvas.value.getContext('2d');
        chartInstance = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Respuestas',
              data: values,
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1
            }]
          },
          options: {
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    });

    onBeforeUnmount(() => {
      if (chartInstance) {
        chartInstance.destroy();
      }
    });

    return {
      chartCanvas
    };
  }
};
</script>

<style>
/* Puedes agregar estilos aquí si es necesario */
</style>
