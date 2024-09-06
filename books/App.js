import React, { useState, useEffect } from "react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  ImageBackground,
  Alert,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { db } from "./firebaseconfig";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { launchImageLibrary } from "react-native-image-picker";

const storage = getStorage();

export default function App() {
  const [nomeLivro, setNomeLivro] = useState("");
  const [autorLivro, setAutorLivro] = useState("");
  const [editoraLivro, setEditoraLivro] = useState("");
  const [anoLivro, setAnoLivro] = useState("");
  const [imagemLivro, setImagemLivro] = useState(null);
  const [flagLivro, setFlagLivro] = useState("Lendo"); // "Lido" ou "Lendo"
  const [livros, setLivros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingLivroId, setEditingLivroId] = useState(null);

  useEffect(() => {
    fetchLivros();
  }, []);

  const adicionarLivro = async () => {
    try {
      setLoading(true);
      let imageUrl = null;
      if (imagemLivro) {
        const storageRef = ref(
          storage,
          `livros/${Date.now()}-${nomeLivro}.jpg`
        );
        const response = await fetch(imagemLivro);
        const blob = await response.blob();
        await uploadBytes(storageRef, blob);
        imageUrl = await getDownloadURL(storageRef);
      }

      if (editingLivroId) {
        // Atualiza o livro no Firebase
        const livroDoc = doc(db, "livros", editingLivroId);
        await updateDoc(livroDoc, {
          nome: nomeLivro,
          autor: autorLivro,
          editora: editoraLivro,
          ano: anoLivro,
          imagem: imageUrl || imagemLivro,
          flag: flagLivro,
        });

        Alert.alert("Livro atualizado com sucesso!");
      } else {
        await addDoc(collection(db, "livros"), {
          nome: nomeLivro,
          autor: autorLivro,
          editora: editoraLivro,
          ano: anoLivro,
          imagem: imageUrl,
          flag: flagLivro,
        });
        Alert.alert("Livro adicionado com sucesso!");
      }
      resetForm();
      fetchLivros();
    } catch (e) {
      console.error("Erro ao adicionar/atualizar livro", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchLivros = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "livros"));
      const livrosList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLivros(livrosList);
    } catch (e) {
      console.error("Erro ao buscar livros", e);
    }
  };

  const escolherImagem = () => {
    const options = {
      mediaType: "photo",
      quality: 1,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log("Seleção de imagem cancelada");
      } else if (response.error) {
        console.log("Erro ao selecionar imagem: ", response.error);
      } else {
        const source = { uri: response.assets[0].uri };
        setImagemLivro(source.uri);
      }
    });
  };

  const editarLivro = (livro) => {
    setNomeLivro(livro.nome);
    setAutorLivro(livro.autor);
    setEditoraLivro(livro.editora);
    setAnoLivro(livro.ano);
    setImagemLivro(livro.imagem);
    setFlagLivro(livro.flag);
    setEditingLivroId(livro.id);
  };

  const excluirLivro = async (livroId) => {
    try {
      const livroDoc = doc(db, "livros", livroId);
      await deleteDoc(livroDoc);
      Alert.alert("Livro excluído com sucesso!");
      fetchLivros();
    } catch (e) {
      console.error("Erro ao excluir livro", e);
    }
  };

  const resetForm = () => {
    setNomeLivro("");
    setAutorLivro("");
    setEditoraLivro("");
    setAnoLivro("");
    setImagemLivro(null);
    setFlagLivro("Lendo");
    setEditingLivroId(null);
  };

  return (
    <ImageBackground
      source={require("./assets/fundo.jpg")}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.innerContainer}>
          <Text style={styles.title}>Biblioteca Pessoal</Text>
          <Text style={styles.label}>Nome do Livro:</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite o nome do livro"
            placeholderTextColor="#aaa"
            value={nomeLivro}
            onChangeText={setNomeLivro}
          />
          <Text style={styles.label}>Autor:</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite o nome do autor"
            placeholderTextColor="#aaa"
            value={autorLivro}
            onChangeText={setAutorLivro}
          />
          <Text style={styles.label}>Editora:</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite o nome da editora"
            placeholderTextColor="#aaa"
            value={editoraLivro}
            onChangeText={setEditoraLivro}
          />
          <Text style={styles.label}>Ano de Publicação:</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite o ano de publicação"
            placeholderTextColor="#aaa"
            value={anoLivro}
            onChangeText={(text) => setAnoLivro(text.replace(/[^0-9]/g, ""))}
            keyboardType="numeric"
          />
          <Text style={styles.label}>Status:</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite 'Lido' ou 'Lendo'"
            placeholderTextColor="#aaa"
            value={flagLivro}
            onChangeText={setFlagLivro}
          />

          <TouchableOpacity onPress={escolherImagem} style={styles.imagePicker}>
            <Text style={styles.imagePickerText}>
              {imagemLivro
                ? "Imagem Selecionada"
                : "Selecionar Imagem do Livro"}
            </Text>
          </TouchableOpacity>
          {imagemLivro && (
            <Image
              source={{ uri: imagemLivro }}
              style={styles.bookImagePreview}
            />
          )}
          <TouchableOpacity
            onPress={adicionarLivro}
            style={styles.addButton}
            disabled={loading}
          >
            <Text style={styles.addButtonText}>
              {loading
                ? "Salvando..."
                : editingLivroId
                ? "Atualizar Livro"
                : "Adicionar Livro"}
            </Text>
          </TouchableOpacity>

          <FlatList
            data={livros}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.bookItem}>
                <Image
                  source={{
                    uri: item.imagem || "https://via.placeholder.com/100",
                  }}
                  style={styles.bookImage}
                />
                <View style={styles.bookInfo}>
                  <Text style={styles.bookName}>{item.nome}</Text>
                  <Text style={styles.bookAuthor}>{item.autor}</Text>
                  <Text style={styles.bookPublisher}>{item.editora}</Text>
                  <Text style={styles.bookYear}>Ano: {item.ano}</Text>
                  <Text style={styles.bookFlag}>Status: {item.flag}</Text>
                </View>
                <View style={styles.bookActions}>
                  <TouchableOpacity
                    onPress={() => editarLivro(item)}
                    style={styles.editButton}
                  >
                    <Icon name="pencil" size={20} color="#ffffff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => excluirLivro(item.id)}
                    style={styles.deleteButton}
                  >
                    <Icon name="trash" size={20} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            style={styles.bookList}
          />
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#f0f8ff",
  },
  innerContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    padding: 20,
    borderRadius: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#4682b4",
    textAlign: "center",
    marginBottom: 20,
  },
  label: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  input: {
    width: "100%",
    padding: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 15,
  },
  imagePicker: {
    width: "100%",
    backgroundColor: "#4682b4",
    padding: 15,
    alignItems: "center",
    borderRadius: 8,
    marginBottom: 15,
  },
  imagePickerText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  bookImagePreview: {
    width: 100,
    height: 150,
    resizeMode: "cover",
    borderRadius: 5,
    alignSelf: "center",
    marginBottom: 15,
  },
  addButton: {
    backgroundColor: "#4682b4",
    padding: 15,
    alignItems: "center",
    borderRadius: 8,
    marginBottom: 15,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  bookList: {
    marginTop: 20,
  },
  bookItem: {
    flexDirection: "row",
    marginBottom: 20,
    backgroundColor: "#e0f7fa",
    padding: 10,
    borderRadius: 5,
  },
  bookImage: {
    width: 100,
    height: 150,
    resizeMode: "cover",
    borderRadius: 5,
    marginRight: 15,
  },
  bookInfo: {
    flex: 1,
  },
  bookName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  bookAuthor: {
    fontSize: 18,
    color: "#555",
  },
  bookPublisher: {
    fontSize: 16,
    color: "#777",
  },
  bookYear: {
    fontSize: 16,
    color: "#777",
  },
  bookFlag: {
    fontSize: 16,
    color: "#777",
  },
  bookActions: {
    justifyContent: "space-around",
    alignItems: "center",
  },
  editButton: {
    backgroundColor: "#4682b4",
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
  },
  deleteButton: {
    backgroundColor: "#ff4500",
    padding: 10,
    borderRadius: 5,
  },
});

// import React, { useState, useEffect } from 'react';
// import { StyleSheet, Text, View, Button, TextInput, FlatList, TouchableOpacity, Image, ImageBackground } from 'react-native';
// import { db, storage } from './firebaseconfig';
// import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
// import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// import Icon from 'react-native-vector-icons/FontAwesome';
// import { launchImageLibrary } from 'react-native-image-picker';

// export default function App() {
//   const [tituloLivro, setTituloLivro] = useState('');
//   const [autorLivro, setAutorLivro] = useState('');
//   const [imageUri, setImageUri] = useState(null);
//   const [livros, setLivros] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [editingLivroId, setEditingLivroId] = useState(null);

//   const selecionarImagem = () => {
//     launchImageLibrary({ mediaType: 'photo' }, (response) => {
//       if (response.didCancel) {
//         console.log('Usuário cancelou o seletor de imagem');
//       } else if (response.error) {
//         console.error('Erro no ImagePicker: ', response.error);
//       } else {
//         setImageUri(response.assets[0].uri);
//       }
//     });
//   };

//   const uploadImage = async () => {
//     if (!imageUri) return null;

//     const response = await fetch(imageUri);
//     const blob = await response.blob();
//     const filename = imageUri.substring(imageUri.lastIndexOf('/') + 1);
//     const storageRef = ref(storage, `livros/${filename}`);

//     await uploadBytes(storageRef, blob);
//     return await getDownloadURL(storageRef);
//   };

//   const adicionarOuAtualizarLivro = async () => {
//     try {
//       setLoading(true);
//       const imageUrl = await uploadImage();

//       if (editingLivroId) {
//         const livroRef = doc(db, 'livros', editingLivroId);
//         await updateDoc(livroRef, {
//           titulo: tituloLivro,
//           autor: autorLivro,
//           imageUrl: imageUrl || null
//         });
//         alert('Livro atualizado com sucesso!');
//         setEditingLivroId(null);
//       } else {
//         await addDoc(collection(db, 'livros'), {
//           titulo: tituloLivro,
//           autor: autorLivro,
//           imageUrl: imageUrl || null
//         });
//         alert('Livro adicionado com sucesso!');
//       }

//       setTituloLivro('');
//       setAutorLivro('');
//       setImageUri(null);
//       fetchLivros();
//     } catch (e) {
//       console.error("Erro ao salvar livro: ", e);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchLivros = async () => {
//     try {
//       const querySnapshot = await getDocs(collection(db, 'livros'));
//       const livrosList = querySnapshot.docs.map(doc => ({
//         ...doc.data(),
//         id: doc.id
//       }));
//       setLivros(livrosList);
//     } catch (e) {
//       console.error("Erro ao buscar livros: ", e);
//     }
//   };

//   const editarLivro = (livro) => {
//     setTituloLivro(livro.titulo);
//     setAutorLivro(livro.autor);
//     setImageUri(livro.imageUrl);
//     setEditingLivroId(livro.id);
//   };

//   const excluirLivro = async (livroId) => {
//     try {
//       await deleteDoc(doc(db, 'livros', livroId));
//       alert('Livro excluído com sucesso!');
//       fetchLivros();
//     } catch (e) {
//       console.error("Erro ao excluir livro: ", e);
//     }
//   };

//   useEffect(() => {
//     fetchLivros();
//   }, []);

//   return (
//     <ImageBackground
//        source={require("./assets/fundo.jpg")}
//       style={styles.container}
//      >
//     <View style={styles.container}>
//       <Text style={styles.title}>Biblioteca Pessoal</Text>

//       <Text style={styles.label}>Título do Livro</Text>
//       <TextInput
//         style={styles.input}
//         placeholder="Digite o título do livro"
//         value={tituloLivro}
//         onChangeText={setTituloLivro}
//       />

//       <Text style={styles.label}>Autor do Livro</Text>
//       <TextInput
//         style={styles.input}
//         placeholder="Digite o autor do livro"
//         value={autorLivro}
//         onChangeText={setAutorLivro}
//       />

//       <Button
//         title="Selecionar Capa"
//         onPress={selecionarImagem}
//         color="#4682b4"
//       />

//       {imageUri && (
//         <Image source={{ uri: imageUri }} style={styles.imagePreview} />
//       )}

//       <Button
//         title={loading ? "Salvando..." : editingLivroId ? "Atualizar Livro" : "Adicionar Livro"}
//         onPress={adicionarOuAtualizarLivro}
//         color="#6b8e23"
//       />

//       <Text style={styles.sectionTitle}>Lista de Livros</Text>
//       <FlatList
//         data={livros}
//         keyExtractor={(item) => item.id}
//         renderItem={({ item }) => (
//           <View style={styles.livroItem}>
//             {item.imageUrl ? (
//               <Image source={{ uri: item.imageUrl }} style={styles.livroImage} />
//             ) : (
//               <Icon name="book" size={50} color="#4682b4" style={styles.livroIcon} />
//             )}
//             <View style={styles.livroDetails}>
//               <Text style={styles.livroTitle}>{item.titulo}</Text>
//               <Text style={styles.livroAutor}>{item.autor}</Text>
//             </View>
//             <View style={styles.actionButtons}>
//               <TouchableOpacity onPress={() => editarLivro(item)} style={styles.actionButton}>
//                 <Icon name="edit" size={25} color="#4682b4" />
//               </TouchableOpacity>
//               <TouchableOpacity onPress={() => excluirLivro(item.id)} style={styles.actionButton}>
//                 <Icon name="trash" size={25} color="#ff6347" />
//               </TouchableOpacity>
//             </View>
//           </View>
//         )}
//         style={styles.livroList}
//       />
//     </View>
//     </ImageBackground>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f0f8ff',
//     padding: 20,
//   },
//   title: {
//     fontSize: 32,
//     fontWeight: 'bold',
//     color: '#4682b4',
//     textAlign: 'center',
//     marginBottom: 20,
//   },
//   label: {
//     fontSize: 18,
//     marginBottom: 5,
//     color: '#333',
//   },
//   input: {
//     width: '100%',
//     padding: 10,
//     marginBottom: 15,
//     borderWidth: 1,
//     borderColor: '#ccc',
//     borderRadius: 5,
//     backgroundColor: '#fff',
//   },
//   imagePreview: {
//     width: '100%',
//     height: 200,
//     marginBottom: 15,
//     borderRadius: 10,
//   },
//   sectionTitle: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#4682b4',
//     marginTop: 20,
//     marginBottom: 10,
//   },
//   livroList: {
//     marginTop: 10,
//   },
//   livroItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//     padding: 10,
//     borderRadius: 5,
//     marginBottom: 10,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 2,
//     elevation: 3,
//   },
//   livroIcon: {
//     marginRight: 15,
//   },
//   livroImage: {
//     width: 50,
//     height: 50,
//     borderRadius: 5,
//     marginRight: 15,
//   },
//   livroDetails: {
//     flex: 1,
//   },
//   livroTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   livroAutor: {
//     fontSize: 16,
//     color: '#555',
//   },
//   actionButtons: {
//     flexDirection: 'row',
//   },
//   actionButton: {
//     marginLeft: 10,
//   },
// });
