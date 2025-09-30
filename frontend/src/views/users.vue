<template>
  <div class="py-4 container-fluid">
    <div class="row">
      <div class="col-12">
        <authors-table
          :tableHead="this.Headers"
          :tableBody="this.info"
          :tableName="this.tableName"
        />
      </div>
    </div>
  </div>
</template>

<script>
import AuthorsTable from "./components/UsersTable.vue";
import tokens from "@/router/services/tokens";

export default {
  name: "tables",
  components: {
    AuthorsTable,
  },
  data() {
    return {
      Headers: [],
      info: [],
      tableName: "Users",
    };
  },
  async beforeMount() {
    const role = await tokens.sendRole();
    const infoAllUsers = await tokens.sendAllUsers(role);
    const forAddHeader = await Object.keys(infoAllUsers[0]);

    this.Headers = forAddHeader
    this.info = infoAllUsers
  },
};
</script>
