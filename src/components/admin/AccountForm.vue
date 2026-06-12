<template>
  <div class="form invitation f-col">
    <v-text-field
      autofocus
      class="filled required"
      label="Username"
      name="username"
      v-model="form.username"
      :error="validators.username.error"
      @input="validators.username.debouncedValidate"
      @blur="validators.username.validate(form.username)"
    />
    <v-text-field
      class="filled"
      label="Email"
      v-model="form.email"
      :error="validators.email.error"
      @input="validators.email.debouncedValidate"
      @blur="validators.email.validate(form.email)"
    />
    <v-text-field
      class="filled"
      label="First Name"
      v-model="form.first_name"
    />
    <v-text-field
      class="filled"
      label="Last Name"
      v-model="form.last_name"
    />
    <v-text-field
      class="filled"
      label="Password"
      type="password"
      v-model="form.password"
    />
    <div class="f-row">
      <v-checkbox label="Active" v-model="form.active"/>
      <v-checkbox label="Superuser" v-model="form.superuser"/>
    </div>
    <template v-if="extraFields">
      <hr class="mx-2 my-4"/>
      <component
        v-for="field in extraFields"
        :key="field.name"
        :is="field.component || 'v-text-field'"
        v-bind="field.params"
        :label="field.label"
        class="filled"
        v-model="extra[field.name]"
      />
    </template>
    <hr class="mx-2 my-4"/>
    <v-switch
      class="round"
      label="Send Activation Email"
      :disabled="form.active || !form.email"
      v-model="form.send_email"
    />
    <div v-if="task.error" class="error f-row-ac f-justify-end m-2">
      <v-icon name="warning" class="mr-2"/>
      <span>Failed to create user account!</span>
    </div>
    <div class="actions f-row f-justify-end p-2">
      <v-btn
        class="round outlined"
        @click="$emit('cancel')"
      >
        Cancel
      </v-btn>
      <v-btn
        class="round"
        color="green"
        :disabled="!formValid"
        :loading="task.pending"
        @click="createUser"
      >
        Submit
      </v-btn>
    </div>
  </div>
</template>

<script>
import { createValidator, requiredValidator, minLengthValidator, emailValidator } from '@/validators.js'
import { watchTask, TaskState } from '@/tasks'

export default {
  props: {
    extraFields: Array
  },
  data () {
    return {
      form: {
        email: '',
        username: '',
        first_name: '',
        last_name: '',
        password: '',
        active: false,
        superuser: false,
        send_email: true
      },
      extra: {},
      task: TaskState()
    }
  },
  computed: {
    validators () {
      return {
        username: createValidator([
          // requiredValidator,
          value => value && this.checkLoginParam('username', value, 'A user with that username already exists.')
        ]),
        email: createValidator([
          // requiredValidator,
          emailValidator,
          value => value && this.checkLoginParam('email', value, 'A user with that email already exists.')
        ])
      }
    },
    formValid () {
      if (!this.form.username) {
        return false
      }
      return Object.values(this.validators).every(v => !v.validating && !v.error)
    }
  },
  created () {
    const data = {}
    this.extraFields?.forEach(f => {
      data[f.name] = f.default
    })
    this.extra = data
  },
  methods: {
    async checkLoginParam (field, value, errMsg) {
      try {
        const params = { field, value }
        const { data } = await this.$http.get('/api/accounts/check/', { params })
        return !data.available && errMsg
      } catch (err) {
        return 'Failed to check availability'
      }
    },
    async createUser () {
      const form = { ...this.form, profile: this.extra }
      const t = this.$http.post('/api/admin/user', form)
      await watchTask(t, this.task)
      if (!t.error) {
        this.$emit('success')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.error {
  color: var(--color-red);
  --icon-color: currentColor;
}
.actions {
  .btn {
    min-width: 130px;
  }
}
</style>
