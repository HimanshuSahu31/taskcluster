resource "random_string" "gce_provider_access_token" {
  length           = 65
  override_special = "_-"
}

resource "google_service_account" "gce_provider" {
  account_id   = "taskcluster-gce-provider"
  display_name = "Taskcluster GCE Provider Service Account"
}

resource "google_service_account_key" "gce_provider" {
  service_account_id = "${google_service_account.gce_provider.name}"
}

// TODO: Make a custom role and lock down to just the permissions necessary
//       Also it would make sense to put the workers in another project
resource "google_project_iam_member" "gce_provider_compute_images" {
  member = "serviceAccount:${google_service_account.gce_provider.email}"
  role   = "roles/compute.imageUser"
}

resource "google_project_iam_member" "gce_provider_compute_instances" {
  member = "serviceAccount:${google_service_account.gce_provider.email}"
  role   = "roles/compute.instanceAdmin.v1"
}

resource "google_project_iam_member" "gce_provider_iam" {
  member = "serviceAccount:${google_service_account.gce_provider.email}"
  role   = "roles/iam.serviceAccountAdmin"
}

resource "google_project_iam_member" "gce_provider_roles" {
  member = "serviceAccount:${google_service_account.gce_provider.email}"
  role   = "roles/iam.roleAdmin"
}

resource "google_project_iam_member" "gce_provider_policy" {
  member = "serviceAccount:${google_service_account.gce_provider.email}"
  role   = "roles/resourcemanager.projectIamAdmin"
}

resource "google_project_iam_member" "gce_provider_assign" {
  member = "serviceAccount:${google_service_account.gce_provider.email}"
  role   = "roles/iam.serviceAccountUser"
}

locals {
  gce_worker_types = [
    {
      configMap = {
        authBaseUrl                    = "${var.root_url}/api/auth/v1"
        cachesDir                      = "/home/taskcluster/caches"
        disableReboots                 = true
        livelogSecret                  = "foobar"
        queueBaseUrl                   = "${var.root_url}/api/queue/v1"
        shutdownMachineOnIdle          = false
        shutdownMachineOnInternalError = false
        signingKeyLocation             = "/home/taskcluster/signing.key"
        tasksDir                       = "/home/taskcluster"
      }

      diskSizeGb  = 32
      image       = "${var.gce_provider_image_name}"
      instances   = 2
      name        = "gce-worker-test"                // worker-type name
      version     = 1
      workerGroup = "gce-worker-test"
      zones       = ["us-east1-b"]
    },
  ]
}

module "gce_provider_secrets" {
  source            = "modules/service-secrets"
  project_name      = "gce-provider"
  disabled_services = "${var.disabled_services}"

  secrets = {
    TASKCLUSTER_CLIENT_ID    = "static/taskcluster/gce-provider"
    TASKCLUSTER_ACCESS_TOKEN = "${random_string.gce_provider_access_token.result}"
    NODE_ENV                 = "production"
    MONITORING_ENABLE        = "false"
    PUBLISH_METADATA         = "false"
    FORCE_SSL                = "false"
    TRUST_PROXY              = "true"
    PROVISIONER_ID           = "gce-provider"

    GOOGLE_PROJECT = "${var.gce_provider_gcp_project}"

    // TODO: Unnecessary once worker has rootUrl support
    CREDENTIAL_URL = "${var.root_url}/api/gce-provider/v1/credentials"

    AUDIENCE                       = "taskclusteraudience"
    GOOGLE_APPLICATION_CREDENTIALS = "/var/run/secret/cloud.google.com/service-account.json"
    WORKER_TYPES                   = "${jsonencode(local.gce_worker_types)}"
  }

  secret_files = {
    service-account-key = "${base64decode(google_service_account_key.gce_provider.private_key)}"
  }
}

module "gce_provider_web_service" {
  source         = "modules/deployment"
  project_name   = "gce-provider"
  service_name   = "gce-provider"
  proc_name      = "web"
  readiness_path = "/api/gce-provider/v1/ping"
  secret_name    = "${module.gce_provider_secrets.secret_name}"
  secrets_hash   = "${module.gce_provider_secrets.secrets_hash}"
  root_url       = "${var.root_url}"
  secret_keys    = "${module.gce_provider_secrets.env_var_keys}"
  docker_image   = "${local.taskcluster_image_gce-provider}"
  is_monoimage   = "false"
}

module "gce_provider_create_workers" {
  source           = "modules/scheduled-job"
  project_name     = "gce-provider"
  service_name     = "gce-provider"
  job_name         = "createTypes"
  schedule         = "*/5 * * * *"
  deadline_seconds = 300
  secret_name      = "${module.gce_provider_secrets.secret_name}"
  secrets_hash     = "${module.gce_provider_secrets.secrets_hash}"
  root_url         = "${var.root_url}"
  secret_keys      = "${module.gce_provider_secrets.env_var_keys}"
  docker_image     = "${local.taskcluster_image_gce-provider}"
  is_monoimage     = "false"

  volume_mounts = [
    {
      source = "service-account-key"
      name   = "service-account.json"
      path   = "/var/run/secret/cloud.google.com/"
    },
  ]
}
