<template>
  <div>
    <div
      class="card bg-white"
    >
      <div
        class="card-body bg-white"
      >
        <form
          enctype="multipart/form-data"
          action="/api/saveCsvViaje"
          method="POST">
          <div
            class="mb-3"
          >
            <label
              for="exampleInputEmail1"
              class="form-label"
              >Cliente</label
            >
            <select
              class="form-select"
              aria-label="Default select example"
              v-model="selectorCLiente"
              name="cliente"
              required
            >
              <option
                v-for="(
                  cliente,
                  index
                ) in this
                  .clientes"
                v-bind:key="
                  index
                "
                :value="cliente._id"
              >
              {{cliente.name}}
              </option>
            </select>
            <br />
          </div>
          <div
            class="mb-3"
          >
            <label
              for="exampleInputPassword1"
              class="form-label"
              >Archivo
              Csv</label
            >
            <input
              type="file"
              class="form-control"
              accept=".csv"
              name="csv"
              required
            />
          </div>
          <div
            class="mb-3 form-check"
          ></div>
          <button
            type="submit"
            class="btn btn-primary"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
<script>
import clientes from "../services/clientes.js";
export default {
  data() {
    return {
      clientes: null,
      selectorCLiente:null,
    };
  },
  async beforeMount() {
    const datosDeCLientes = await clientes.findClientes();

    this.clientes = datosDeCLientes;
  },
};
</script>
