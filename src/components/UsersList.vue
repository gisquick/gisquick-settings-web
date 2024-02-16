<template>
  <input-field
    :label="label"
    color="primary"
    class="users-list"
    :class="{focused}"
    :error="hasDeletedUsers ? 'Contains inactive or deleted users' : null"
  >
    <div class="input">
      <v-autocomplete
        placeholder="Find user"
        class="filled"
        :min-chars="2"
        :items="filteredUsers"
        highlight-fields="username,first_name,last_name"
        @input="onInput"
        @text:update="onTextChange"
      >
        <template v-slot:item="{ item, html }">
          <div class="item f-row f-grow">
            <div class="f-grow">
              <div class="title" v-html="html.username"/>
              <small v-if="item.first_name" class="name first" v-html="html.first_name"/>
              <small v-html="html.last_name"/>
            </div>
          </div>
        </template>

        <!-- <template v-slot:append>
          <v-menu
            ref="menu"
            aria-label="Vybrať dátum"
            transition="slide-y"
            align="rr;bb,tt"
            content-class="popup-content popup-menu light"
          >
            <template v-slot:activator="{ open }">
              <v-btn class="icon" @click.stop="open">
                <v-icon name="menu"/>
              </v-btn>
            </template>
            <template v-slot:menu>
              <div class="card">
                <v-select
                  :items="['item 1', 'item 2']"
                  value="item 1"
                />
              </div>
            </template>
          </v-menu>
        </template> -->

      </v-autocomplete>
      <hr/>

      <!-- <div class="list m-2">
        <div v-if="!users.length" class="item p-2 text-center">
          Empty List
        </div>
        <div
          v-for="user in users"
          :key="user.username"
          class="item f-row-ac p-2"
          :class="{selected: selected === user.username}"
          @click="selected = user.username"
        >
          <span class="f-grow">
            {{ user.username }} <span v-if="user.full_name"> ({{ user.full_name }})</span>
          </span>
          <v-btn v-show="selected === user.username" class="remove icon" tabindex="-1-" @click="removeUser(user.username)">
            <v-icon name="delete_forever"/>
          </v-btn>
        </div>
      </div> -->

      <v-list
        class="flat"
        item-key="username"
        :items="users"
        :selected="selected"
        @click-item="selectItem"
      >
        <template v-slot:empty>
          <div class="empty p-2">No users specified</div>
        </template>
        <template v-slot:item="{ item }">
          <v-icon v-if="item.invalid" name="warning" color="orange" class="mr-2"/>
          <slot name="list-item" :user="item">
            <span class="f-grow mr-2">
              {{ item.username }} <span v-if="item.full_name"> ({{ item.full_name }})</span>
            </span>
          </slot>
          <v-btn
            v-show="selected === item.username"
            class="remove icon small m-0"
            tabindex="-1-"
            @click.stop="removeUser(item.username)"
          >
            <v-icon name="delete_forever"/>
          </v-btn>
        </template>
      </v-list>
    </div>

  </input-field>
</template>

<script>
import keyBy from 'lodash/keyBy'
import InputField from '@/ui/InputField.vue'
import VAutocomplete from '@/ui/Autocomplete.vue'
// import VList from '@/ui/ActionList.vue'
import Focusable from '@/ui/mixins/Focusable'

import { sanitize, escapeRegExp, removeDiacritics } from '@/ui/utils/text'


export default {
  components: { InputField, VAutocomplete },
  mixins: [ Focusable ],
  props: {
    label: {
      type: String,
      default: 'Users'
    },
    value: Array,
    task: Object
  },
  data () {
    return {
      text: '',
      selected: null
    }
  },
  computed: {
    usersList () {
      return this.task.data ?? []
    },
    usersMap () {
      return keyBy(this.usersList, 'username')
    },
    users () {
      return this.task.success && this.value ? this.value.map(k => this.usersMap[k] ?? { username: k, invalid: true }) : []
    },
    filteredUsers () {
      if (this.usersList.length && this.text?.length > 1) {
        const regex = new RegExp(escapeRegExp(sanitize(removeDiacritics(this.text))), 'i')
        return this.usersList
          .filter(u => !this.value || this.value.indexOf(u.username) === -1)
          .filter(u => regex.test(removeDiacritics(u.username)))
      }
      return []
    },
    hasDeletedUsers () {
      return this.task.success && this.value?.some(username => !this.usersMap[username])
    }
  },
  methods: {
    onTextChange (text) {
      this.text = text
      // this.filterUsers(text)
    },
    onInput (user, field) {
      if (this.value && this.value.some(u => u.username === user.username)) {
        return
      }
      this.$emit('input', Array.isArray(this.value) ? [...this.value, user.username] : [user.username])
      this.text = ''
      field.clear()
    },
    removeUser (username) {
      const value = this.value.filter(u => u !== username)
      this.$emit('input', value)
      this.selected = null
    },
    selectItem (item) {
      this.selected = item.username
    }
  }
}
</script>

<style lang="scss" scoped>
.name.first {
  margin-right: 3px;
}
.users-list {
  gap: 2px;
  .input {
    border: 1px solid var(--border-color, #ddd);
    height: auto;
    background-color: var(--fill-color);
    &::after {
      display: none;
    }
  }
  .empty {
    color: #999;
    text-transform: uppercase;
    font-size: 13px;
    font-weight: 500;
    text-align: center;
  }
}
.box {
  // background-color: #f5f5f5;
  // border: 1px solid var(--border-color, #ddd);

  .autocomplete {
    background-color: #f2f2f2;
  }
  .item {
    height: 36px;
    &.selected {
      background-color: var(--color-primary);
      color: #fff;
    }
  }
}
</style>
