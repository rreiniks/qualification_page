#!/bin/bash

# Pārtraukt skriptu kļūdas gadījumā
set -e 

PROJECT_DIR="$HOME/Documents/prog-test"

echo "Sistēmas izvietošanas skripts"
echo "-----------------------------"

echo "[1/6] Pieprasām sudo tiesības..."
sudo -v
while true; do sudo -n true; sleep 60; kill -0 "$$" || exit; done 2>/dev/null &

echo "[2/6] Pārbaudām un instalējam atkarības..."
install_dependencies() {
    local MISSING_DEPS=0
    
    for cmd in ansible docker npm node virsh; do
        if ! command -v $cmd &> /dev/null; then
            echo "Trūkst: $cmd"
            MISSING_DEPS=1
        fi
    done

    if ! command -v terraform &> /dev/null; then
        echo "Trūkst: terraform"
        MISSING_DEPS=1
    fi

    if [ $MISSING_DEPS -eq 1 ]; then
        echo "Instalē trūkstošās atkarības..."
        sudo apt-get update
        sudo apt-get install -y ansible docker.io npm nodejs qemu-kvm libvirt-daemon-system libvirt-clients bridge-utils curl software-properties-common gnupg2

        sudo usermod -aG libvirt $USER
        sudo usermod -aG kvm $USER

        if ! command -v terraform &> /dev/null; then
            curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo gpg --yes --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
            echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
            sudo apt-get update
            sudo apt-get install -y terraform
        fi
        echo "Atkarības uzstādītas."
    fi
}
install_dependencies

KEY_PATH="$HOME/.ssh/k8s_project"
if [ ! -f "$KEY_PATH" ]; then
    echo "Ģenerējam SSH atslēgu Ansible piekļuvei..."
    ssh-keygen -t ed25519 -f "$KEY_PATH" -q -N ""
fi

echo "[3/6] Pārveidojam infrastruktūru (Terraform)..."
cd "$PROJECT_DIR/terraform"
terraform destroy -auto-approve
terraform apply -auto-approve

echo "Gaidām 45s, lai virtuālās mašīnas ieslēgtos..."
sleep 45

echo "[4/6] Būvējam Docker attēlus..."
cd "$PROJECT_DIR/app/qualification_page"

sudo docker image prune -f
rm -rf *.tar
npm run build

sudo docker build -f Dockerfile.api -t web-api:latest .
sudo docker build -f Dockerfile.web -t web-frontend:latest .
sudo docker save -o web-api.tar web-api:latest
sudo docker save -o web-frontend.tar web-frontend:latest
sudo chown $USER:$USER web-api.tar web-frontend.tar

cd "$PROJECT_DIR/data_generation"
rm -rf *.tar
sudo docker build -f Dockerfile -t db-seeder:latest .
sudo docker save -o db-seeder.tar db-seeder:latest
sudo chown $USER:$USER db-seeder.tar

echo "[5/6] Izvietojam klasterī (Ansible)..."
cd "$PROJECT_DIR/ansible"
ansible-playbook -i inventory.ini install_k8s.yml
ansible-playbook -i inventory.ini deploy_app.yml

ansible all -i inventory.ini -b -m copy -a "src=../data_generation/db-seeder.tar dest=/tmp/db-seeder.tar"
ansible all -i inventory.ini -b -m shell -a "k3s ctr images import /tmp/db-seeder.tar"

echo "Gaidām 20s (attēlu ielāde)..."
sleep 20

echo "[6/6] Palaižam lietotni un sēklu..."
ansible master -i inventory.ini -b -m copy -a "src=../k3s/app-deployment.yaml dest=/tmp/app-deployment.yaml"
ansible master -i inventory.ini -b -m copy -a "src=../k3s/data-seed-job.yaml dest=/tmp/data-seed-job.yaml"

ansible master -i inventory.ini -b -m shell -a "k3s kubectl apply -f /tmp/app-deployment.yaml"
ansible master -i inventory.ini -b -m shell -a "k3s kubectl apply -f /tmp/data-seed-job.yaml"

echo "Gaidām 15s (podu palaišana)..."
sleep 15

MASTER_IP=$(awk '/\[master\]/{getline; print $1}' inventory.ini)

echo "-----------------------------"
echo "Izvietošana pabeigta."
echo "Lapa pieejama: http://${MASTER_IP}:30080"
echo "-----------------------------"

echo "Gaidām datu ģenerāciju (līdz 120s)..."
ansible master -i inventory.ini -b -m shell -a "k3s kubectl wait --for=condition=complete job/riot-data-seeder --timeout=120s" > /dev/null 2>&1

echo "Testa dati:"
ansible master -i inventory.ini -b -m shell -a "k3s kubectl logs job/riot-data-seeder"