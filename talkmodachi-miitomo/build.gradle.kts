plugins {
    id("java")
    id("application")
    id("com.gradleup.shadow") version "9.2.2"
}

group = "com.github.dylanpdx"
version = "1.0-SNAPSHOT"

repositories {
    mavenCentral()
}

dependencies {
    testImplementation(platform("org.junit:junit-bom:6.0.0"))
    testImplementation("org.junit.jupiter:junit-jupiter")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
    implementation("com.github.zhkl0228:unidbg-android:0.9.8")
    implementation("com.github.zhkl0228:unidbg-unicorn2:0.9.8")
}

tasks.test {
    useJUnitPlatform()
}

application {
    mainClass = "com.github.dylanpdx.Main"
}
