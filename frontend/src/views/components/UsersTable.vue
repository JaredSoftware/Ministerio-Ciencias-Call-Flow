<template>
  <div class="card">
    <div class="card-header pb-0 bg-light">
      <h6>{{ tableName }}</h6>
    </div>
    <div class="card-body px-0 pt-0 pb-2 bg-light">
      <div class="table-responsive p-0">
        <table class="table align-items-center mb-0">
          <thead>
            <tr>
              <th v-for="(item, index) in tableHead" :key="index" class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">{{ item }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in tableBody" :key="index">
              <td v-for="(x, y) in tableBodyIndex" :key="y">
                <div v-if="y === 6" class="d-flex px-2 py-1">
                  <select class="form-select" aria-label="Default select example" @change="updateRol(item._id)">
                    <option v-for="(rol, indiceDelRol) in AllRoles" :key="indiceDelRol" :value="rol._id" :selected="rolSelected(rol._id,item[x])">
                      {{ rol.nombre }}
                    </option>
                  </select>
                </div> 
                <div v-else-if="y === 7" class="d-flex px-2 py-1">
                  <select class="form-select" aria-label="Default select example" @change="updateStat(item._id)">
                    <option v-for="(stat, indiceDelRol) in status" :key="indiceDelRol" :selected="statSelected(stat,item[x])">
                      {{ stat }}
                    </option>
                  </select>
                </div>
                <div v-else class="d-flex px-2 py-1">
                  <div class="d-flex flex-column justify-content-center">
                    <p class="text-xs text-secondary mb-0">{{ item[x] }}</p>
                  </div>
                </div>  
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="card-footer bg-light"></div>
  </div>
</template>

<script>
import getRoles from "../../services/tokens";
import roleAndActivate from "../../services/roleAndActivate";

export default {
  name: "authors-table",
  data(){
    return{
      AllRoles:Array,
      status:[false,true]
    }
  },
  props:{
    tableHead:Array,
    tableBody:Array,
    tableName:String,
  },
  async beforeMount(){
      const info = await getRoles.sendRoles();
      this.AllRoles = info
  },
  computed:{
    tableBodyIndex(){
      const indices = Object.keys(this.tableBody[0]);
      return indices
    },
  },
  methods:{
    rolSelected(rol1,rol2){
      if (rol1 === rol2) {
        return true
      }else{
        return false
      }
    },
    statSelected(stat1,stat2){
      if (stat1 === stat2) {
        return true
      }else{
        return false
      }
    },
    async updateRol(id){
      const rol = event.target.value
      const info = await roleAndActivate.rolChanger(id,rol)
      if (info.restart === true) {
        localStorage.clear();
        this.$router.push("/");
      }
    },
    async updateStat(id){
      const stat = event.target.value
      const info = await roleAndActivate.statChanger(id,stat)
      if (info.restart === true) {
        localStorage.clear();
        this.$router.push("/");
      }
    },
  }
};
</script>
