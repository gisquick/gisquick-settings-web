<template>
  <div class="page light f-col">
    <div class="f-col">
      <v-table
        class="outlined m-2"
        :columns="columns"
        :items="tableData"
        :sort="sort"
        @update:sort="sort = $event"
    >
      <template v-slot:cell(alias)="{ value, item }">
        <v-text-field
          class="m-0"
          :value="value"
          @input="setAlias(item.name, $event)"
          lazy
        />
      </template>
      </v-table>
    </div>
  </div>
</template>

<script>

export default {
  components: {  },
  data () {
    return {
      aliases: null,
      sort: {
        sort: 'asc',
        sortBy: 'username'
      }
    }
  },
  computed: {
    columns () {
      return [
        {
          key: 'name',
          label: 'Name',
          sortable: true
        }, {
          key: 'alias',
          label: 'Alias'
      }]
    },
    tableData () {
      if (this.aliases) {
        return Object.entries(this.aliases).map(([name, alias]) => ({ name, alias }))
      }
      return []
    }
  },
  mounted () {
    this.fetchAliases()
  },
  methods: {
    async fetchAliases () {
      const { data } = await this.$http.get('/api/admin/aliases', { params: { domain: location.hostname } })
      this.aliases = data
    },
    async setAlias (name, alias) {
      try {
        const { data } = await this.$http.post('/api/admin/alias', { alias, name }, { params: { domain: location.hostname } })
        this.aliases = data
        this.$notify.success('Success')
      } catch (err) {
        this.$notify.error('Failed')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.page {
  max-width: 1200px;
  @media (min-width: 601px) {
    padding: 8px;
  }
}
</style>
