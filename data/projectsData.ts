interface Project {
  title: string,
  description: string,
  href?: string,
  imgSrc?: string,
}

const projectsData: Project[] = [
  {
    title: 'Kubecarga',
    description: `Um exemplo de teste de carga em Go para clusters Kubernetes. O teste cria deployments de forma contínua em intervalos regulares para simular carga no cluster.`,
    imgSrc: '/static/images/kubecarga.png',
    href: 'https://github.com/Tech-Preta/kubecarga',
  },
  {
    title: 'Helm Charts',
    description: `Uma coleção de Helm Charts criados ou com contribuições de Natalia Granato para diferentes aplicações.`,
    imgSrc: '/static/images/helm.png',
    href: 'https://github.com/Tech-Preta/charts',
  },
  {
    title: 'Packer Base',
    description: `Uma base para a criação de imagens utilizando Packer, com provisionamento feito através de playbooks do Ansible.`,
    imgSrc: '/static/images/packer.png',
    href: 'https://github.com/Tech-Preta/packer_base',
  },
  {
    title: 'Kubeshell',
    description: `O projeto Kubeshell é uma coleção de scripts úteis e ferramentas de linha de comando para ajudar administradores de clusters Kubernetes.`,
    imgSrc: '/static/images/kubeshell.png',
    href: 'https://github.com/Tech-Preta/kubeshell',
  },
  {
    title: 'Análise de Custos AWS com Python',
    description: `Um script Python que permite ao usuário analisar os custos dos serviços AWS em um período de tempo específico.`,
    imgSrc: '/static/images/aws-py.png',
    href: 'https://github.com/Tech-Preta/aws-cost-py',
  },
  {
    title: 'Kubesec',
    description: `O projeto Kubesec é uma solução abrangente para análise e relatórios de segurança em clusters Kubernetes.`,
    imgSrc: '/static/images/kubesec.png',
    href: 'https://github.com/Tech-Preta/kubesec',
  },
  {
    title: 'Gerador de Senhas com Redis',
    description: `Projeto de dockerização de um gerador de senhas, com pipeline de build, push para o Docker Hub, scan de vulnerabilidades com o Trivy e assinatura de imagens com o Cosign. 
    O gerador de senhas é uma aplicação em Python que utiliza o Redis para armazenar as senhas geradas.`,
    imgSrc: '/static/images/dockerized.jpg',
    href: 'https://github.com/Tech-Preta/giropops-senhas',
  },
]

export default projectsData
