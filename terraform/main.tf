terraform {
  required_providers {
    libvirt = {
      source = "dmacvicar/libvirt"
      version = "0.7.6"
    }
  }
}

provider "libvirt" {
  uri = "qemu:///system"
}

resource "libvirt_volume" "ubuntu_base" {
  name   = "ubuntu-22.04-base.qcow2"
  pool   = "default"
  source = "https://cloud-images.ubuntu.com/jammy/current/jammy-server-cloudimg-amd64.img"
  format = "qcow2"
}

data "local_file" "ssh_key" {
  filename = pathexpand("~/.ssh/k8s_project.pub")
}

resource "libvirt_cloudinit_disk" "commoninit" {
  name           = "commoninit.iso"
  pool           = "default"
  user_data      = <<-EOT
    #cloud-config
    users:
      - name: ubuntu
        sudo: ALL=(ALL) NOPASSWD:ALL
        groups: sudo
        shell: /bin/bash
        ssh_authorized_keys:
          - ${trimspace(data.local_file.ssh_key.content)}
  EOT
}

locals {
  nodes = ["k8s-master", "k8s-worker1", "k8s-worker2"]
}

resource "libvirt_volume" "vm_disk" {
  count          = length(local.nodes)
  name           = "${local.nodes[count.index]}-disk.qcow2"
  pool           = "default"
  base_volume_id = libvirt_volume.ubuntu_base.id
  size           = 21474836480
}

# Definējam pašas virtuālās mašīnas (RAM: 4GB, CPU: 2)
resource "libvirt_domain" "k8s_node" {
  count  = length(local.nodes)
  name   = local.nodes[count.index]
  memory = 4096
  vcpu   = 2

  cloudinit = libvirt_cloudinit_disk.commoninit.id

  network_interface {
    network_name   = "default"
    wait_for_lease = true # Gaidam, kamēr maršrutētājs iedos IP adresi
  }

  console {
    type        = "pty"
    target_port = "0"
    target_type = "serial"
  }

  disk {
    volume_id = libvirt_volume.vm_disk[count.index].id
  }
}

# Izvadam piešķirtās IP adreses terminālī
output "vm_ips" {
  value = libvirt_domain.k8s_node[*].network_interface[0].addresses[0]
}

resource "local_file" "ansible_inventory" {
  content = <<-EOT
    [master]
    ${libvirt_domain.k8s_node[0].network_interface[0].addresses[0]}
    
    [app_node]
    ${libvirt_domain.k8s_node[1].network_interface[0].addresses[0]}
    
    [db_node]
    ${libvirt_domain.k8s_node[2].network_interface[0].addresses[0]}
    
    [workers:children]
    app_node
    db_node
    
    [all:vars]
    ansible_user=ubuntu
    ansible_ssh_private_key_file=~/.ssh/k8s_project
    ansible_ssh_common_args='-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null'
  EOT
  filename = "../ansible/inventory.ini"
}