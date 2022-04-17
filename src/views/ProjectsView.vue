<template>
  <div class="projects light">
    <!-- <div class="expander" v-text="Array(120).fill('_').join(' ')"/> -->
    <div class="toolbar f-row-ac">
      <span class="title m-2">Projects</span>
      <v-text-field class="filled" placeholder="Search">
        <template v-slot:append>
          <v-icon name="search" class="mx-2"/>
        </template>
      </v-text-field>
      <div class="f-grow"/>
      <v-select
        align="rr;bb,tt"
        class="sort filled"
        placeholder="Sort by"
        :items="sortingItems"
        v-model="sortBy"
      >
        <!-- <template v-slot:item="{ item }">
        </template> -->
      </v-select>

      <!-- <v-btn class="icon flat" :disabled="!sortBy" @click="toggleSortDir">
        <v-icon size="24" :name="sortDir === 'asc' ? 'sort-down' : 'sort-up'"/>
      </v-btn> -->

      <v-btn class="icon flat" :disabled="!sortBy" @click="toggleSortDir">
        <v-icon :name="sortDir === 'asc' ? 'sort-down2' : 'sort-up2'"/>
      </v-btn>

      <v-btn color="primary" to="/publish">
        New Project
      </v-btn>
    </div>
    <div class="list mx-auto">
      <div
        v-for="p in sortedProjects"
        :key="p.name"
        class="card"
      >
        <img v-if="p.thumbnail" :src="`/api/project/thumbnail/${p.name}`"/>
        <map-img v-else/>
        <router-link :to="{ path: '/' + p.name }" class="f-col px-2">
          <span v-text="p.title" class="title"/>
          <span v-text="p.name" class="name"/>
        </router-link>
        <div class="details f-row-ac">
          <v-badge color="#626262" glow>{{ p.projection }}</v-badge>
          <div class="f-row-ac m-2">
            <v-icon name="storage" color="#626262" size="16" class="m-1"/>
            <span v-text="p.size"/>
          </div>
        </div>
        <div class="time-info f-col">
          <div>Created: <span :title="p.created.datetime" v-text="p.created.date"/></div>
          <div>Updated: <span :title="p.updated.datetime" v-text="p.updated.date"/></div>
        </div>
        <v-badge class="auth dark" :color="statusColorMap[p.state]">
          <span class="uppercase" v-text="p.state"/>
          <v-icon v-if="p.authentication" :name="authIcons[p.authentication]" size="18"/>
        </v-badge>
      </div>
    </div>
  </div>
</template>

<script>
import orderBy from 'lodash/orderBy'
import MapImg from '@/assets/map.svg?inline'
import { TaskState, watchTask } from '@/tasks'

export default {
  name: 'ProjectsPage',
  components: { MapImg },
  props: {
    user: String
  },
  data () {
    return {
      sortBy: '',
      sortDir: 'asc',
      fetchTask: TaskState()
    }
  },
  computed: {
    statusColorMap () {
      return {
        empty: 'grey',
        staged: 'orange',
        published: 'green'
      }
    },
    authIcons () {
      return {
        private: 'lock',
        public: 'globe',
        users: 'users'
      }
    },
    projects () {
      return this.fetchTask.data || []
    },
    sortingItems () {
      return [{
        text: 'Creation Date',
        value: 'created.datetime'
      }, {
        text: 'Last Updated',
        value: 'updated.datetime'
      }, {
        text: 'Title',
        value: 'title'
      }]
    },
    formattedProjects () {
      return this.projects.map(({ size, created, last_update, ...data }) => ({
        ...data,
        created: this.formatDate(created),
        updated: this.formatDate(last_update),
        size: this.$format.filesize(size)
      }))
    },
    sortedProjects () {
      if (this.sortBy) {
        return orderBy(this.formattedProjects, this.sortBy, this.sortDir)
      }
      return this.formattedProjects
    }
  },
  watch: {
    user: 'fetchProjects'
  },
  mounted () {
    this.fetchProjects()
  },
  methods: {
    formatDate (d) {
      return {
        date: this.$format.date(d),
        datetime: this.$format.datetime(d)
      }
    },
    fetchProjects () {
      const url = this.user ? `/api/projects/${this.user}/` : '/api/projects/'
      const t = this.$http.get(url)
      watchTask(t, this.fetchTask)
    },
    toggleSortDir () {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'
    }
  }
}
</script>

<style lang="scss" scoped>
.projects {
  width: clamp(600px, 100%, 1200px);
  // align-self: center;
  grid-column: 2 / 3;
  // width: 1200px;
  // width: clamp(600px, 100%, 100vw);

  max-width: 1200px;
}
.card {
  display: grid;
  grid-template-columns: 150px 1fr auto;
  gap: 8px;
  padding: 4px 8px;
  img, svg {
    max-height: 120px;
    max-width: 100%;
    width: auto;
    height: auto;
    grid-row: 1 / 3;
    justify-self: center;
    align-self: center;
  }
  a {
    justify-self: start;
    text-decoration: none;
    color: var(--color-primary);
    .title {
      font-size: 20px;
    }
    .name {
      font-weight: 500;
    }
  }
  .details {
    font-size: 13px;
    font-weight: 500;
    color: #555;
    grid-column: 2 / 3;
  }
}
.time-info {
  text-align: right;
  font-size: 13.5px;
}
.auth {
  grid-area: 1 / 3 / 2 / 4;
  align-self: start;
  justify-self: end;
}
.toolbar {
  // background-color: rgb(255, 255, 255);
  .title {
    font-size: 24px;
    font-weight: bold;
    text-transform: uppercase;
  }
  .select.sort {
    min-width: 130px;
  }
}
.expander {
  line-height: 0;
  height: 0;
  max-height: 0;
  visibility: hidden;
  overflow: hidden;
}
</style>