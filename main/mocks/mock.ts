export const PROFILE_MANIFEST = {
  profileId: 'TheVeil-main-prod',
  name: 'The Veil - Horror Survival',
  version: '1.0.6',
  mcVersion: '1.20.1',
  // fabricVersion: "0.15.11",
  fabricVersion: '0.16.14',
  gameDir: './instances/TheVeil-main-prod/.minecraft',
  lastPlayed: '',
  totalPlaytime: 0,
  loader: {
    version: '1.0.3',
    url: 'https://maven.fabricmc.net/net/fabricmc/fabric-installer/1.0.3/fabric-installer-1.0.3.jar',
    checksum:
      '38aa82ab1ef829b7aa3f2143fcc93bba706a8e18835be731d0fdf231d274b07f',
  },
  assets: {
    url: 'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json',
    checksum:
      'e425ed3ceb22e6120559c0b5b8b2dcba6886cf44f4f31295503bc2d5dddb40dd',
    index: '5',
  },
  client: {
    checksum:
      '56b71336d2b4fdffd197f56595b0da93e32a946f78f382a299b8f4b92758bb0f',
  },
  mods: {
    // "veil-core": {
    //   fileName: "veil-core-1.0.5.jar",
    //   version: "1.0.5",
    //   required: true,
    //   checksum: "sha256:abc123...",
    //   downloadUrl: "https://your-server.com/mods/veil-core-1.0.5.jar",
    // },
    'fabric-api': {
      fileName: 'fabric-api-0.92.6+1.20.1.jar',
      version: '0.92.6+1.20.1',
      required: true,
      checksum:
        '0ece50476da3692111ab04b75945c5458e70d98cd069eefc044ab3e57977deeb',
      downloadUrl:
        'https://cdn.modrinth.com/data/P7dR8mSH/versions/UapVHwiP/fabric-api-0.92.6%2B1.20.1.jar',
    },
  },
  clientSettings: {
    allocatedMemory: 4096,
  },
  libraries: {
    'com.github.oshi:oshi-core:6.2.2': {
      sha1: '54f5efc19bca95d709d9a37d19ffcbba3d21c1a6',
      size: 947865,
    },
    'com.google.code.gson:gson:2.10': {
      sha1: 'dd9b193aef96e973d5a11ab13cd17430c2e4306b',
      size: 286235,
    },
    'com.google.guava:failureaccess:1.0.1': {
      sha1: '1dcf1de382a0bf95a3d8b0849546c88bac1292c9',
      size: 4617,
    },
    'com.google.guava:guava:31.1-jre': {
      sha1: '60458f877d055d0c9114d9e1a2efb737b4bc282c',
      size: 2959479,
    },
    'com.ibm.icu:icu4j:71.1': {
      sha1: '9e7d3304c23f9ba5cb71915f7cce23231a57a445',
      size: 13963762,
    },
    'com.mojang:authlib:4.0.43': {
      sha1: '2ff9d747a77570a07a60d32ac77eb6162ad2a2d9',
      size: 121766,
    },
    'com.mojang:blocklist:1.0.10': {
      sha1: '5c685c5ffa94c4cd39496c7184c1d122e515ecef',
      size: 964,
    },
    'com.mojang:brigadier:1.1.8': {
      sha1: '5244ce82c3337bba4a196a3ce858bfaecc74404a',
      size: 77121,
    },
    'com.mojang:datafixerupper:6.0.8': {
      sha1: '3ba4a30557a9b057760af4011f909ba619fc5125',
      size: 689960,
    },
    'com.mojang:logging:1.1.1': {
      sha1: '832b8e6674a9b325a5175a3a6267dfaf34c85139',
      size: 15343,
    },
    'com.mojang:patchy:2.2.10': {
      sha1: 'da05971b07cbb379d002cf7eaec6a2048211fefc',
      size: 4439,
    },
    'com.mojang:text2speech:1.17.9': {
      sha1: '3cad216e3a7f0c19b4b394388bc9ffc446f13b14',
      size: 12243,
    },
    'commons-codec:commons-codec:1.15': {
      sha1: '49d94806b6e3dc933dacbd8acb0fdbab8ebd1e5d',
      size: 353793,
    },
    'commons-io:commons-io:2.11.0': {
      sha1: 'a2503f302b11ebde7ebc3df41daebe0e4eea3689',
      size: 327135,
    },
    'commons-logging:commons-logging:1.2': {
      sha1: '4bfc12adfe4842bf07b657f0369c4cb522955686',
      size: 61829,
    },
    'io.netty:netty-buffer:4.1.82.Final': {
      sha1: 'a544270cf1ae8b8077082f5036436a9a9971ea71',
      size: 304664,
    },
    'io.netty:netty-codec:4.1.82.Final': {
      sha1: 'b77200379acb345a9ffdece1c605e591ac3e4e0a',
      size: 339155,
    },
    'io.netty:netty-common:4.1.82.Final': {
      sha1: '022d148e85c3f5ebdacc0ce1f5aabb1d420f73f3',
      size: 653880,
    },
    'io.netty:netty-handler:4.1.82.Final': {
      sha1: '644041d1fa96a5d3130a29e8978630d716d76e38',
      size: 538569,
    },
    'io.netty:netty-resolver:4.1.82.Final': {
      sha1: '38f665ae8dcd29032eea31245ba7806bed2e0fa8',
      size: 37776,
    },
    'io.netty:netty-transport-classes-epoll:4.1.82.Final': {
      sha1: 'e7c7dd18deac93105797f30057c912651ea76521',
      size: 142066,
    },
    'io.netty:netty-transport-native-unix-common:4.1.82.Final': {
      sha1: '3e895b35ca1b8a0eca56cacff4c2dde5d2c6abce',
      size: 43684,
    },
    'io.netty:netty-transport:4.1.82.Final': {
      sha1: 'e431a218d91acb6476ccad5f5aafde50aa3945ca',
      size: 485752,
    },
    'it.unimi.dsi:fastutil:8.5.9': {
      sha1: 'bb7ea75ecdb216654237830b3a96d87ad91f8cc5',
      size: 23376043,
    },
    'net.java.dev.jna:jna-platform:5.12.1': {
      sha1: '097406a297c852f4a41e688a176ec675f72e8329',
      size: 1356627,
    },
    'net.java.dev.jna:jna:5.12.1': {
      sha1: 'b1e93a735caea94f503e95e6fe79bf9cdc1e985d',
      size: 1866196,
    },
    'net.sf.jopt-simple:jopt-simple:5.0.4': {
      sha1: '4fdac2fbe92dfad86aa6e9301736f6b4342a3f5c',
      size: 78146,
    },
    'org.apache.commons:commons-compress:1.21': {
      sha1: '4ec95b60d4e86b5c95a0e919cb172a0af98011ef',
      size: 1018316,
    },
    'org.apache.commons:commons-lang3:3.12.0': {
      sha1: 'c6842c86792ff03b9f1d1fe2aab8dc23aa6c6f0e',
      size: 587402,
    },
    'org.apache.httpcomponents:httpclient:4.5.13': {
      sha1: 'e5f6cae5ca7ecaac1ec2827a9e2d65ae2869cada',
      size: 780321,
    },
    'org.apache.httpcomponents:httpcore:4.4.15': {
      sha1: '7f2e0c573eaa7a74bac2e89b359e1f73d92a0a1d',
      size: 328324,
    },
    'org.apache.logging.log4j:log4j-api:2.19.0': {
      sha1: 'ea1b37f38c327596b216542bc636cfdc0b8036fa',
      size: 317566,
    },
    'org.apache.logging.log4j:log4j-core:2.19.0': {
      sha1: '3b6eeb4de4c49c0fe38a4ee27188ff5fee44d0bb',
      size: 1864386,
    },
    'org.apache.logging.log4j:log4j-slf4j2-impl:2.19.0': {
      sha1: '5c04bfdd63ce9dceb2e284b81e96b6a70010ee10',
      size: 27721,
    },
    'org.joml:joml:1.10.5': {
      sha1: '22566d58af70ad3d72308bab63b8339906deb649',
      size: 712082,
    },
    'org.lwjgl:lwjgl-glfw:3.3.1': {
      sha1: 'cbac1b8d30cb4795149c1ef540f912671a8616d0',
      size: 128801,
    },
    'org.lwjgl:lwjgl-glfw:3.3.1:natives-windows': {
      sha1: 'ed892f945cf7e79c8756796f32d00fa4ceaf573b',
      size: 145512,
    },
    'org.lwjgl:lwjgl-jemalloc:3.3.1': {
      sha1: 'a817bcf213db49f710603677457567c37d53e103',
      size: 36601,
    },
    'org.lwjgl:lwjgl-jemalloc:3.3.1:natives-windows': {
      sha1: '948a89b76a16aa324b046ae9308891216ffce5f9',
      size: 135585,
    },
    'org.lwjgl:lwjgl-openal:3.3.1': {
      sha1: '2623a6b8ae1dfcd880738656a9f0243d2e6840bd',
      size: 88237,
    },
    'org.lwjgl:lwjgl-openal:3.3.1:natives-windows': {
      sha1: '30a474d0e57193d7bc128849a3ab66bc9316fdb1',
      size: 576872,
    },
    'org.lwjgl:lwjgl-opengl:3.3.1': {
      sha1: '831a5533a21a5f4f81bbc51bb13e9899319b5411',
      size: 921563,
    },
    'org.lwjgl:lwjgl-opengl:3.3.1:natives-windows': {
      sha1: 'c1807e9bd571402787d7e37e3029776ae2513bb8',
      size: 100205,
    },
    'org.lwjgl:lwjgl-stb:3.3.1': {
      sha1: 'b119297cf8ed01f247abe8685857f8e7fcf5980f',
      size: 112380,
    },
    'org.lwjgl:lwjgl-stb:3.3.1:natives-windows': {
      sha1: '86315914ac119efdb02dc9e8e978ade84f1702af',
      size: 256301,
    },
    'org.lwjgl:lwjgl-tinyfd:3.3.1': {
      sha1: '0ff1914111ef2e3e0110ef2dabc8d8cdaad82347',
      size: 6767,
    },
    'org.lwjgl:lwjgl-tinyfd:3.3.1:natives-windows': {
      sha1: 'a5d830475ec0958d9fdba1559efa99aef211e6ff',
      size: 127930,
    },
    'org.lwjgl:lwjgl:3.3.1': {
      sha1: 'ae58664f88e18a9bb2c77b063833ca7aaec484cb',
      size: 724243,
    },
    'org.lwjgl:lwjgl:3.3.1:natives-windows': {
      sha1: '0036c37f16ab611b3aa11f3bcf80b1d509b4ce6b',
      size: 159361,
    },
    'org.slf4j:slf4j-api:2.0.1': {
      sha1: 'f48d81adce2abf5ad3cfe463df517952749e03bc',
      size: 61388,
    },
  },
  directories: [
    '.minecraft',
    'fabric-loader',
    'java',
    'launcher-cache',
    './.minecraft/mods',
    './.minecraft/config',
    './.minecraft/resourcepacks',
    './.minecraft/saves',
    './.minecraft/logs',
    './.minecraft/shaderpacks',
    './.minecraft/screenshots',
    './.minecraft/assets',
    './.minecraft/versions',
  ],
};
