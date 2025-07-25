<template>
  <div>
    <vue-good-table :columns="columns" :rows="rows">
      <template #table-row="props">
        <span v-if="props.column.field == 'contact.answers'">
          <table class="table">
            <thead>
              <tr>
                <th scope="col">Pregunta</th>
                <th scope="col">Respuesta</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(x, y) in props.row.contact.answers" :key="y">
                <th>{{ x.answer_text }}</th>
                <th v-if="Number(x.respuesta) > 5" style="color: blue">
                  {{ x.respuesta }}
                </th>
                <th v-else style="color: red">{{ x.respuesta }}</th>
              </tr>
            </tbody>
          </table>
        </span>
      </template>
      <template v-slot:table-actions>
        <div class="input-group">
          <div class="input-group-prepend">
            <input
              type="datetime-local"
              class="form-control"
              aria-describedby="basic-addon1"
              v-model="fi"
              @input="handleInputChange"
            />
          </div>
          &nbsp;
          <div class="input-group-prepend">
            <input
              type="datetime-local"
              class="form-control"
              aria-describedby="basic-addon2"
              v-model="ff"
              @input="handleInputChange"
            />
          </div>
          &nbsp;
          <button class="btn btn-success" @click="downloadCSV">
            <i class="ni ni-single-copy-04"></i>
          </button>
          &nbsp;
          <button class="btn btn-primary" @click="downloadPDF">
            <i class="ni ni-single-copy-04"></i>
          </button>
          &nbsp;
        </div>
      </template>
    </vue-good-table>
  </div>
</template>

<script>
import surveys from "@/router/services/surveys";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Chart from "chart.js";

export default {
  data() {
    return {
      columns: [
        {
          label: "Id Contacto",
          field: "contact.contact_id",
        },
        {
          label: "Nombre",
          field: "contact.first_name",
        },
        {
          label: "Apellido",
          field: "contact.last_name",
        },
        {
          label: "Correo",
          field: "contact.email",
        },
        {
          label: "Telefono",
          field: "contact.phone",
        },
        {
          label: "UUID Contacto",
          field: "contact.uuid_call",
        },
        {
          label: "Fecha",
          field: "contact.formatted_createdad",
        },
        {
          label: "Preguntas",
          field: "contact.answers",
        },
      ],
      rows: [],
      fi: new Date(),
      ff: Date,
    };
  },
  methods: {
    async handleInputChange() {
      const response = await surveys.dataFromTable(this.fi, this.ff);
    this.rows = response;
    },
    downloadCSV() {
      const csvData = this.generateCSVData();
      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "tabla.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    generateCSVData() {
      const rows = this.rows;
      const columns = this.columns;
      const keys = Object.keys(this.rows[0].contact);

      let csv = "";

      const headers = columns.map((column) => column.label);
      csv += headers.join(",") + "\n";

      rows.map((row) => {
        const rowData = keys.map((column) => {
          if (column === "answers") {
            const rowAnswer = row.contact[column].map((x) => {
              return `|${x.answer_text}|${x.respuesta}|`;
            });
            return rowAnswer;
          } else {
            return row.contact[column];
          }
        });
        csv += rowData.join(",") + "\n";
      });

      return csv;
    },
    async downloadPDF() {
      const pdfData = await this.generatePDFData();
      const blob = new Blob([pdfData], { type: "application/pdf" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "tabla.pdf");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    async generatePDFData() {
      const table = document.getElementById("vgt-table");
      if (!table) {
        throw new Error("No se encontró el elemento '.vue-good-table'");
      }

      const canvas = await html2canvas(table);
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF();
      pdf.addImage(imgData, "PNG", 10, 10, 190, 0);
      return pdf.output("blob");
    },
    generateChart() {
      const tableData = this.rows; // Obtén los datos de la tabla de vue-good-table
      const labels = tableData.map((row) => row.contact.first_name); // Utiliza los nombres como etiquetas del gráfico
      const data = tableData.map((row) => row.contact.answers.length); // Utiliza la longitud de las respuestas como datos del gráfico

      const ctx = document.getElementById("myChart").getContext("2d");
      new Chart(ctx, {
        type: "bar",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Cantidad de respuestas",
              data: data,
              backgroundColor: "rgba(75, 192, 192, 0.2)",
              borderColor: "rgba(75, 192, 192, 1)",
              borderWidth: 1,
            },
          ],
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      });
    },
  },
  async beforeMount() {
    let fecha = new Date();
    this.ff = new Date(fecha.setDate(fecha.getDate() + 1));
    const response = await surveys.dataFromTable(this.fi, fecha);
    this.rows = response;
  },
};
</script>