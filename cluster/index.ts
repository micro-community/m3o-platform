import * as pulumi from "@pulumi/pulumi";
import * as ocean from "@pulumi/digitalocean";
import * as k8s from "@pulumi/kubernetes";

const conf = new pulumi.Config("digitalocean");

export const project = new ocean.Project("project", {
  environment: conf.require("env"),
  name: conf.require("name"),
});

export const vpc = new ocean.Vpc("vpc", {
  region: conf.require("region"),
},{ 
  parent: project,
});

export const cluster = new ocean.KubernetesCluster("cluster", {
  region: conf.require("region") as ocean.Region,
  version: conf.require("k8s_version"),
  nodePool: {
    nodeCount: 1,
    name: "default-pool",
    size: "s-1vcpu-2gb",
  },
  vpcUuid: vpc.id,
},{
  parent: project,
});

export const nodePool = new ocean.KubernetesNodePool("node-pool", {
  name: "micro",
  clusterId: cluster.id,
  size: "s-8vcpu-16gb" as any,
  minNodes: 2,
  maxNodes: 6,
  autoScale: true,
});

export const kubeconfig = cluster.kubeConfigs[0]!.rawConfig;

export const provider = new k8s.Provider("k8s-provider",
  { kubeconfig },
  { dependsOn: [cluster, nodePool] },
);

export default [
  vpc,
  cluster,
  kubeconfig,
  provider,
  nodePool,
]